// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../SwagFormProofManager.sol";
import "../interfaces/IWeb2Json.sol";

contract SwagFormProofManagerScript is Script {
    // Parametri per l'attestazione Web2Json - Verifica Tweet
    // Questi parametri definiscono l'API Twitter da chiamare per verificare l'esistenza del tweet
    string public apiUrl = "https://api.twitter.com/2/tweets/${tweetId}"; // API per verificare tweet
    string public httpMethod = "GET";
    string public headers = '{"Authorization": "Bearer ${TWITTER_BEARER_TOKEN}"}';
    string public queryParams = "?tweet.fields=created_at,author_id,text&user.fields=username";
    string public body = "{}";
    
    // Filtro jq per processare la risposta API Twitter
    string public postProcessJq = 
        '{tweetId: .data.id, authorUsername: .includes.users[0].username, tweetText: .data.text, createdAt: .data.created_at, exists: true, timestamp: now}';
    
    // Signature ABI per decodificare la risposta
    string public abiSignature = 
        '{"components": [{"internalType": "string", "name": "tweetId", "type": "string"},{"internalType": "string", "name": "authorUsername", "type": "string"},{"internalType": "string", "name": "tweetText", "type": "string"},{"internalType": "string", "name": "createdAt", "type": "string"},{"internalType": "bool", "name": "exists", "type": "bool"},{"internalType": "uint256", "name": "timestamp", "type": "uint256"}],"name": "verifiedTweet","type": "tuple"}';
    
    // Indirizzo del contratto SwagForm su World Chain
    address public constant SWAGFORM_WORLD_CHAIN_CONTRACT = 0xDD0a13b48dd11985Ca8d7562B9564232AB8719B8;
    
    string public constant attestationTypeName = "SwagFormProofManager";
    string public constant dirPath = "./script/";
    
    function run() external {
        // Ottieni la chiave privata dalle variabili d'ambiente
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy del contratto SwagFormProofManager
        SwagFormProofManager proofManager = new SwagFormProofManager(SWAGFORM_WORLD_CHAIN_CONTRACT);
        
        console.log("SwagFormProofManager deployed at:", address(proofManager));
        
        vm.stopBroadcast();
        
        // Salva l'indirizzo del contratto per uso futuro
        writeToFile(
            dirPath,
            string.concat(attestationTypeName, "_address"),
            toHexString(abi.encodePacked(address(proofManager))),
            true
        );
        
        console.log("Deployment completed successfully!");
        console.log("Contract address saved to:", string.concat(dirPath, attestationTypeName, "_address.txt"));
    }
    
    // Funzione di utilità per scrivere file
    function writeToFile(
        string memory path,
        string memory filename,
        string memory content,
        bool overwrite
    ) internal {
        string memory fullPath = string.concat(path, filename, ".txt");
        
        if (overwrite) {
            vm.writeFile(fullPath, content);
        } else {
            vm.writeLine(fullPath, content);
        }
    }
    
    // Funzione di utilità per convertire address in hex string
    function toHexString(bytes memory data) internal pure returns (string memory) {
        bytes memory hexChars = "0123456789abcdef";
        bytes memory str = new bytes(2 + data.length * 2);
        str[0] = '0';
        str[1] = 'x';
        for (uint256 i = 0; i < data.length; i++) {
            str[2 + i * 2] = hexChars[uint8(data[i] >> 4)];
            str[3 + i * 2] = hexChars[uint8(data[i] & 0x0f)];
        }
        return string(str);
    }
}

// Contratto per interagire con il contratto deployato
contract InteractWithSwagFormProofManager is Script {
    function run() external {
        // Leggi l'indirizzo del contratto deployato
        string memory addressString = vm.readLine(
            string.concat("./script/", "SwagFormProofManager", "_address", ".txt")
        );
        address contractAddress = vm.parseAddress(addressString);
        
        // Leggi la proof dai file (se disponibile)
        string memory proofString;
        try vm.readLine("./script/SwagFormProofManager_proof.txt") returns (string memory _proofString) {
            proofString = _proofString;
        } catch {
            console.log("No proof file found, skipping proof verification");
            return;
        }
        
        bytes memory proofBytes = vm.parseBytes(proofString);
        IWeb2Json.Proof memory proof = abi.decode(proofBytes, (IWeb2Json.Proof));
        
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        // Instanzia il contratto
        SwagFormProofManager proofManager = SwagFormProofManager(contractAddress);
        
        // Verifica i dati del tweet
        proofManager.verifyTweetData(proof);
        
        console.log("Tweet verification completed!");
        
        vm.stopBroadcast();
    }
}

// Contratto per testare le funzionalità del proof manager
contract TestSwagFormProofManager is Script {
    function run() external {
        // Leggi l'indirizzo del contratto deployato
        string memory addressString = vm.readLine(
            string.concat("./script/", "SwagFormProofManager", "_address", ".txt")
        );
        address contractAddress = vm.parseAddress(addressString);
        
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        SwagFormProofManager proofManager = SwagFormProofManager(contractAddress);
        
        // Test: genera un hash di prova
        bytes32 testHash = proofManager.generateProofHash(
            "test api response",
            block.timestamp,
            msg.sender
        );
        
        console.log("Generated test proof hash:");
        console.logBytes32(testHash);
        
        // Test: associa la proof a una domanda del form
        // proofManager.linkProofToQuestion(1, 0, testHash);
        
        console.log("Test completed successfully!");
        
        vm.stopBroadcast();
    }
} 