// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {ContractRegistry} from "@flarenetwork/flare-periphery-contracts/coston2/ContractRegistry.sol";
import {IWeb2Json} from "@flarenetwork/flare-periphery-contracts/coston2/IWeb2Json.sol";

/**
 * @title SimpleHealthProofManager
 * @dev Manages health check proof verification for SwagForm using Flare Data Connector
 */
contract SimpleHealthProofManager {
    
    // Events
    event HealthCheckVerified(
        uint256 indexed formId,
        uint256 indexed questionIndex,
        address indexed user,
        string status,
        string timestamp,
        bool isHealthy
    );

    event ProofLinked(
        uint256 indexed formId,
        uint256 indexed questionIndex,
        address indexed user,
        string timestamp
    );

    // Structs
    struct HealthData {
        string status;
        string timestamp;
        bool isHealthy;
        bool verified;
    }

    struct ProofLink {
        uint256 formId;
        uint256 questionIndex;
        address user;
        string timestamp;
        uint256 verificationTimestamp;
    }

    // State variables
    mapping(string => HealthData) public healthData;
    mapping(bytes32 => ProofLink) public proofLinks;
    mapping(uint256 => mapping(uint256 => mapping(address => string))) public userHealthCheckForQuestion;
    mapping(string => bool) public verifiedHealthChecks;
    
    // Form -> Question -> User -> Verification status
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) public isProofVerified;

    // Array to track all verified health checks
    string[] public allVerifiedHealthChecks;

    // Modifiers
    modifier onlyValidProof(IWeb2Json.Proof memory proof) {
        require(isValidWeb2JsonProof(proof), "Invalid FDC proof");
        _;
    }

    modifier onlyValidTimestamp(string memory timestamp) {
        require(bytes(timestamp).length > 0, "Timestamp cannot be empty");
        _;
    }

    /**
     * @dev Verify health check data using Flare Data Connector Web2Json proof
     * @param proof The FDC proof containing health check data
     */
    function verifyHealthData(IWeb2Json.Proof memory proof) 
        external 
        onlyValidProof(proof) 
    {
        // Decode the health data from the proof
        HealthData memory health = decodeHealthData(proof.data.responseBody.abiEncodedData);
        
        // Check if status is "healthy"
        bool isHealthy = keccak256(abi.encodePacked(health.status)) == keccak256(abi.encodePacked("healthy"));
        
        // Store the health data
        healthData[health.timestamp] = HealthData({
            status: health.status,
            timestamp: health.timestamp,
            isHealthy: isHealthy,
            verified: true
        });

        // Mark as verified if healthy
        if (isHealthy && !verifiedHealthChecks[health.timestamp]) {
            verifiedHealthChecks[health.timestamp] = true;
            allVerifiedHealthChecks.push(health.timestamp);
        }

        emit HealthCheckVerified(
            0, // formId will be set in linkProofToQuestion
            0, // questionIndex will be set in linkProofToQuestion
            msg.sender,
            health.status,
            health.timestamp,
            isHealthy
        );
    }

    /**
     * @dev Link verified health proof to a specific form question
     * @param formId The World Chain form ID
     * @param questionIndex The index of the question requiring proof
     * @param timestamp The verified health check timestamp
     */
    function linkProofToQuestion(
        uint256 formId,
        uint256 questionIndex,
        string memory timestamp
    ) external onlyValidTimestamp(timestamp) {
        require(verifiedHealthChecks[timestamp], "Health check not verified");
        require(healthData[timestamp].isHealthy, "Health check not healthy");
        
        bytes32 proofKey = keccak256(abi.encodePacked(formId, questionIndex, msg.sender));
        
        // Create proof link
        proofLinks[proofKey] = ProofLink({
            formId: formId,
            questionIndex: questionIndex,
            user: msg.sender,
            timestamp: timestamp,
            verificationTimestamp: block.timestamp
        });

        // Update mappings
        userHealthCheckForQuestion[formId][questionIndex][msg.sender] = timestamp;
        isProofVerified[formId][questionIndex][msg.sender] = true;

        emit ProofLinked(formId, questionIndex, msg.sender, timestamp);
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
     * @dev Get health data for a specific user and question
     * @param formId The World Chain form ID
     * @param questionIndex The index of the question
     * @param user The user address
     * @return HealthData The health data
     */
    function getHealthDataForUser(
        uint256 formId,
        uint256 questionIndex,
        address user
    ) external view returns (HealthData memory) {
        string memory timestamp = userHealthCheckForQuestion[formId][questionIndex][user];
        return healthData[timestamp];
    }

    /**
     * @dev Get all verified health checks
     * @return string[] Array of verified health check timestamps
     */
    function getAllVerifiedHealthChecks() external view returns (string[] memory) {
        return allVerifiedHealthChecks;
    }

    /**
     * @dev Get health data by timestamp
     * @param timestamp The health check timestamp
     * @return HealthData The health data
     */
    function getHealthData(string memory timestamp) external view returns (HealthData memory) {
        return healthData[timestamp];
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
     * @dev Check if health check is verified and healthy
     * @param timestamp The health check timestamp
     * @return bool True if health check is verified and healthy
     */
    function isHealthCheckVerified(string memory timestamp) external view returns (bool) {
        return verifiedHealthChecks[timestamp] && healthData[timestamp].isHealthy;
    }

    /**
     * @dev Get total number of verified health checks
     * @return uint256 Total count
     */
    function getTotalVerifiedHealthChecks() external view returns (uint256) {
        return allVerifiedHealthChecks.length;
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
     * @dev Decode health data from ABI encoded response
     * @param encodedData The ABI encoded health data
     * @return HealthData The decoded health data
     */
    function decodeHealthData(bytes memory encodedData) internal pure returns (HealthData memory) {
        // Decode the data as a HealthData struct (matching the ABI signature from our API)
        HealthData memory decodedHealth = abi.decode(encodedData, (HealthData));
        
        return HealthData({
            status: decodedHealth.status,
            timestamp: decodedHealth.timestamp,
            isHealthy: false, // Will be determined in verifyHealthData
            verified: false // Will be set to true in verifyHealthData
        });
    }

    /**
     * @dev Emergency function to manually verify a health check (for testing)
     * @param status The health status
     * @param timestamp The timestamp
     */
    function manualVerifyHealthCheck(
        string memory status,
        string memory timestamp
    ) external onlyValidTimestamp(timestamp) {
        require(!verifiedHealthChecks[timestamp], "Health check already verified");
        
        bool isHealthy = keccak256(abi.encodePacked(status)) == keccak256(abi.encodePacked("healthy"));
        
        healthData[timestamp] = HealthData({
            status: status,
            timestamp: timestamp,
            isHealthy: isHealthy,
            verified: true
        });

        if (isHealthy) {
            verifiedHealthChecks[timestamp] = true;
            allVerifiedHealthChecks.push(timestamp);
        }

        emit HealthCheckVerified(0, 0, msg.sender, status, timestamp, isHealthy);
    }
} 