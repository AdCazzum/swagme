// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {ContractRegistry} from "@flarenetwork/flare-periphery-contracts/coston2/ContractRegistry.sol";
import {IWeb2Json} from "@flarenetwork/flare-periphery-contracts/coston2/IWeb2Json.sol";

/**
 * @title SwagFormProofManager
 * @dev Manages Twitter proof verification for SwagForm using Flare Data Connector
 */
contract SwagFormProofManager {

    // Events
    event TweetVerified(
        uint256 indexed formId,
        uint256 indexed questionIndex,
        address indexed user,
        string tweetId,
        bool exists,
        uint256 timestamp
    );

    event ProofLinked(
        uint256 indexed formId,
        uint256 indexed questionIndex,
        address indexed user,
        string tweetId
    );

    // Structs
    struct TweetData {
        string tweetId;
        string authorUsername;
        string tweetText;
        string createdAt;
        bool exists;
        uint256 timestamp;
        bool verified;
    }

    struct ProofLink {
        uint256 formId;
        uint256 questionIndex;
        address user;
        string tweetId;
        uint256 verificationTimestamp;
    }

    // State variables
    mapping(string => TweetData) public tweetData;
    mapping(bytes32 => ProofLink) public proofLinks;
    mapping(uint256 => mapping(uint256 => mapping(address => string))) public userTweetForQuestion;
    mapping(string => bool) public verifiedTweets;
    
    // Form -> Question -> User -> Verification status
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) public isProofVerified;

    // Array to track all verified tweets
    string[] public allVerifiedTweets;

    // Modifiers
    modifier onlyValidProof(IWeb2Json.Proof memory proof) {
        require(isValidWeb2JsonProof(proof), "Invalid FDC proof");
        _;
    }

    modifier onlyValidTweetId(string memory tweetId) {
        require(bytes(tweetId).length > 0, "Tweet ID cannot be empty");
        require(isValidTweetIdFormat(tweetId), "Invalid tweet ID format");
        _;
    }

    /**
     * @dev Verify tweet data using Flare Data Connector Web2Json proof
     * @param proof The FDC proof containing tweet data
     */
    function verifyTweetData(IWeb2Json.Proof memory proof) 
        external 
        onlyValidProof(proof) 
    {
        // Decode the tweet data from the proof
        TweetData memory tweet = decodeTweetData(proof.data.responseBody.abiEncodedData);
        
        // Store the tweet data
        tweetData[tweet.tweetId] = TweetData({
            tweetId: tweet.tweetId,
            authorUsername: tweet.authorUsername,
            tweetText: tweet.tweetText,
            createdAt: tweet.createdAt,
            exists: tweet.exists,
            timestamp: tweet.timestamp,
            verified: true
        });

        // Mark as verified
        if (tweet.exists && !verifiedTweets[tweet.tweetId]) {
            verifiedTweets[tweet.tweetId] = true;
            allVerifiedTweets.push(tweet.tweetId);
        }

        emit TweetVerified(
            0, // formId will be set in linkProofToQuestion
            0, // questionIndex will be set in linkProofToQuestion
            msg.sender,
            tweet.tweetId,
            tweet.exists,
            tweet.timestamp
        );
    }

    /**
     * @dev Link verified tweet proof to a specific form question
     * @param formId The World Chain form ID
     * @param questionIndex The index of the question requiring proof
     * @param tweetId The verified tweet ID
     */
    function linkProofToQuestion(
        uint256 formId,
        uint256 questionIndex,
        string memory tweetId
    ) external onlyValidTweetId(tweetId) {
        require(verifiedTweets[tweetId], "Tweet not verified");
        require(tweetData[tweetId].exists, "Tweet does not exist");
        
        bytes32 proofKey = keccak256(abi.encodePacked(formId, questionIndex, msg.sender));
        
        // Create proof link
        proofLinks[proofKey] = ProofLink({
            formId: formId,
            questionIndex: questionIndex,
            user: msg.sender,
            tweetId: tweetId,
            verificationTimestamp: block.timestamp
        });

        // Update mappings
        userTweetForQuestion[formId][questionIndex][msg.sender] = tweetId;
        isProofVerified[formId][questionIndex][msg.sender] = true;

        emit ProofLinked(formId, questionIndex, msg.sender, tweetId);
    }

    /**
     * @dev Check if a proof is verified for a specific user and question
     * @param formId The World Chain form ID
     * @param questionIndex The index of the question
     * @param user The user address
     * @return bool True if proof is verified
     */
    function isProofVerifiedForUser(
        uint256 formId,
        uint256 questionIndex,
        address user
    ) external view returns (bool) {
        return isProofVerified[formId][questionIndex][user];
    }

    /**
     * @dev Get tweet data for a specific user and question
     * @param formId The World Chain form ID
     * @param questionIndex The index of the question
     * @param user The user address
     * @return TweetData The tweet data
     */
    function getTweetDataForUser(
        uint256 formId,
        uint256 questionIndex,
        address user
    ) external view returns (TweetData memory) {
        string memory tweetId = userTweetForQuestion[formId][questionIndex][user];
        return tweetData[tweetId];
    }

    /**
     * @dev Get all verified tweets
     * @return string[] Array of verified tweet IDs
     */
    function getAllVerifiedTweets() external view returns (string[] memory) {
        return allVerifiedTweets;
    }

    /**
     * @dev Get tweet data by ID
     * @param tweetId The tweet ID
     * @return TweetData The tweet data
     */
    function getTweetData(string memory tweetId) external view returns (TweetData memory) {
        return tweetData[tweetId];
    }

    /**
     * @dev Get proof link data
     * @param formId The World Chain form ID
     * @param questionIndex The index of the question
     * @param user The user address
     * @return ProofLink The proof link data
     */
    function getProofLink(
        uint256 formId,
        uint256 questionIndex,
        address user
    ) external view returns (ProofLink memory) {
        bytes32 proofKey = keccak256(abi.encodePacked(formId, questionIndex, user));
        return proofLinks[proofKey];
    }

    /**
     * @dev Check if tweet exists and is verified
     * @param tweetId The tweet ID
     * @return bool True if tweet exists and is verified
     */
    function isTweetVerified(string memory tweetId) external view returns (bool) {
        return verifiedTweets[tweetId] && tweetData[tweetId].exists;
    }

    /**
     * @dev Get total number of verified tweets
     * @return uint256 Total count
     */
    function getTotalVerifiedTweets() external view returns (uint256) {
        return allVerifiedTweets.length;
    }

    // Internal functions

    /**
     * @dev Validate Web2Json proof using Flare's verification system
     * @param proof The FDC proof
     * @return bool True if proof is valid
     */
    function isValidWeb2JsonProof(IWeb2Json.Proof memory proof) internal view returns (bool) {
        try ContractRegistry.getFdcVerification().verifyJsonApi(proof) returns (bool isValid) {
            return isValid;
        } catch {
            return false;
        }
    }

    /**
     * @dev Decode tweet data from ABI encoded response
     * @param encodedData The ABI encoded tweet data
     * @return TweetData The decoded tweet data
     */
    function decodeTweetData(bytes memory encodedData) internal pure returns (TweetData memory) {
        // Decode the data as a TweetData struct (matching the ABI signature from our API)
        TweetData memory decodedTweet = abi.decode(encodedData, (TweetData));
        
        return TweetData({
            tweetId: decodedTweet.tweetId,
            authorUsername: decodedTweet.authorUsername,
            tweetText: decodedTweet.tweetText,
            createdAt: decodedTweet.createdAt,
            exists: decodedTweet.exists,
            timestamp: decodedTweet.timestamp,
            verified: false // Will be set to true in verifyTweetData
        });
    }

    /**
     * @dev Validate tweet ID format
     * @param tweetId The tweet ID to validate
     * @return bool True if valid format
     */
    function isValidTweetIdFormat(string memory tweetId) internal pure returns (bool) {
        bytes memory tweetIdBytes = bytes(tweetId);
        if (tweetIdBytes.length == 0 || tweetIdBytes.length > 20) {
            return false;
        }
        
        // Check if all characters are digits
        for (uint256 i = 0; i < tweetIdBytes.length; i++) {
            if (tweetIdBytes[i] < 0x30 || tweetIdBytes[i] > 0x39) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * @dev Emergency function to manually verify a tweet (for testing)
     * @param tweetId The tweet ID
     * @param exists Whether the tweet exists
     * @param authorUsername The author username
     * @param tweetText The tweet text
     */
    function manualVerifyTweet(
        string memory tweetId,
        bool exists,
        string memory authorUsername,
        string memory tweetText
    ) external onlyValidTweetId(tweetId) {
        require(!verifiedTweets[tweetId], "Tweet already verified");
        
        tweetData[tweetId] = TweetData({
            tweetId: tweetId,
            authorUsername: authorUsername,
            tweetText: tweetText,
            createdAt: "",
            exists: exists,
            timestamp: block.timestamp,
            verified: true
        });

        if (exists) {
            verifiedTweets[tweetId] = true;
            allVerifiedTweets.push(tweetId);
        }

        emit TweetVerified(0, 0, msg.sender, tweetId, exists, block.timestamp);
    }
} 