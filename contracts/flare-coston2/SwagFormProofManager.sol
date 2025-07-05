// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "./interfaces/IWeb2Json.sol";
import "./interfaces/ISwagFormWorldChain.sol";

contract SwagFormProofManager {
    // Struttura per i dati verificati dall'API Twitter
    struct VerifiedTweet {
        string tweetId;
        string authorUsername;
        string tweetText;
        string createdAt;
        bool exists;
        uint256 timestamp;
    }
    
    // Indirizzo del contratto SwagForm su World Chain
    address public swagFormWorldChainContract;
    
    // Mapping per tenere traccia delle proof verificate
    mapping(bytes32 => VerifiedTweet) public verifiedProofs;
    mapping(address => mapping(uint256 => mapping(uint256 => bytes32))) public userProofHashes; // user => formId => questionIndex => proofHash
    
    // Eventi
    event ProofVerified(
        address indexed user,
        uint256 indexed formId,
        uint256 indexed questionIndex,
        bytes32 proofHash,
        bool isValid
    );
    
    event ProofSubmitted(
        address indexed user,
        uint256 indexed formId,
        uint256 indexed questionIndex,
        string apiResponse
    );
    
    // Modificatore per verificare che il proof sia valido
    modifier validProof(IWeb2Json.Proof memory proof) {
        require(proof.data.responseBody.length > 0, "Invalid proof data");
        _;
    }
    
    constructor(address _swagFormWorldChainContract) {
        swagFormWorldChainContract = _swagFormWorldChainContract;
    }
    
    /**
     * @dev Funzione principale per verificare le proof Web2Json
     * Questa funzione viene chiamata dal sistema Flare dopo la verifica
     */
    function verifyTweetData(IWeb2Json.Proof memory proof) external validProof(proof) {
        // Decodifica la risposta API Twitter
        VerifiedTweet memory tweetData = decodeTwitterResponse(proof.data.responseBody);
        
        // Genera un hash unico per questa proof
        bytes32 proofHash = keccak256(abi.encodePacked(
            proof.data.responseBody,
            proof.data.timestamp,
            msg.sender
        ));
        
        // Salva i dati verificati
        verifiedProofs[proofHash] = VerifiedTweet({
            tweetId: tweetData.tweetId,
            authorUsername: tweetData.authorUsername,
            tweetText: tweetData.tweetText,
            createdAt: tweetData.createdAt,
            exists: true,
            timestamp: block.timestamp
        });
        
        emit ProofSubmitted(msg.sender, 0, 0, proof.data.responseBody);
    }
    
    /**
     * @dev Associa una proof verificata a una specifica domanda di un form
     */
    function linkProofToQuestion(
        uint256 formId,
        uint256 questionIndex,
        bytes32 proofHash
    ) external {
        require(verifiedProofs[proofHash].exists, "Tweet not verified");
        
        // Associa la proof alla domanda
        userProofHashes[msg.sender][formId][questionIndex] = proofHash;
        
        // Notifica il contratto World Chain che la proof è stata verificata
        if (swagFormWorldChainContract != address(0)) {
            try ISwagFormWorldChain(swagFormWorldChainContract).setProofVerified(
                formId,
                msg.sender,
                questionIndex,
                true
            ) {} catch {
                // Gestione errore silente per ora
            }
        }
        
        emit ProofVerified(msg.sender, formId, questionIndex, proofHash, true);
    }
    
    /**
     * @dev Decodifica la risposta API Twitter in una struttura VerifiedTweet
     * Questa funzione deve essere personalizzata in base all'API utilizzata
     */
    function decodeTwitterResponse(string memory apiResponse) internal pure returns (VerifiedTweet memory) {
        // Implementazione semplificata - in produzione dovrebbe usare un parser JSON
        // Per ora restituiamo dati mock per testing
        return VerifiedTweet({
            tweetId: "1234567890123456789",
            authorUsername: "testuser",
            tweetText: "This is a test tweet",
            createdAt: "2024-01-01T00:00:00Z",
            exists: true,
            timestamp: block.timestamp
        });
    }
    
    /**
     * @dev Ottiene i dati verificati per una specifica proof
     */
    function getVerifiedTweet(bytes32 proofHash) external view returns (VerifiedTweet memory) {
        return verifiedProofs[proofHash];
    }
    
    /**
     * @dev Verifica se un utente ha una proof verificata per una specifica domanda
     */
    function hasVerifiedProof(
        address user,
        uint256 formId,
        uint256 questionIndex
    ) external view returns (bool) {
        bytes32 proofHash = userProofHashes[user][formId][questionIndex];
        return proofHash != bytes32(0) && verifiedProofs[proofHash].exists;
    }
    
    /**
     * @dev Ottiene l'hash della proof per una specifica domanda di un utente
     */
    function getUserProofHash(
        address user,
        uint256 formId,
        uint256 questionIndex
    ) external view returns (bytes32) {
        return userProofHashes[user][formId][questionIndex];
    }
    
    /**
     * @dev Aggiorna l'indirizzo del contratto World Chain
     */
    function setSwagFormWorldChainContract(address _newContract) external {
        // Dovrebbe essere protetto da onlyOwner in produzione
        swagFormWorldChainContract = _newContract;
    }
    
    /**
     * @dev Funzione di utilità per generare proof hash per testing
     */
    function generateProofHash(
        string memory apiResponse,
        uint256 timestamp,
        address user
    ) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(apiResponse, timestamp, user));
    }
} 