import { ethers, run } from "hardhat";
import hre from "hardhat";
import { prepareAttestationRequestBase, submitAttestationRequest, retrieveDataAndProofBaseWithRetry } from "./Base";
import path from "path";
import fs from "fs";

// Environment variables
const { WEB2JSON_VERIFIER_URL_TESTNET, VERIFIER_API_KEY_TESTNET, COSTON2_DA_LAYER_URL } = process.env;

// Twitter verification API configuration
const baseApiUrl = "http://localhost:8000";
const postProcessJq = `{tweetId: .data.tweetId, authorUsername: .data.authorUsername, tweetText: .data.tweetText, createdAt: .data.createdAt, exists: .data.exists, timestamp: .data.timestamp}`;
const httpMethod = "GET";
const headers = "{}";
const queryParams = "{}";
const body = "{}";

// ABI signature for TweetData struct - must be escaped JSON string per Flare documentation
const abiSignature = `{\\"components\\": [{\\"internalType\\": \\"string\\", \\"name\\": \\"tweetId\\", \\"type\\": \\"string\\"}, {\\"internalType\\": \\"string\\", \\"name\\": \\"authorUsername\\", \\"type\\": \\"string\\"}, {\\"internalType\\": \\"string\\", \\"name\\": \\"tweetText\\", \\"type\\": \\"string\\"}, {\\"internalType\\": \\"string\\", \\"name\\": \\"createdAt\\", \\"type\\": \\"string\\"}, {\\"internalType\\": \\"bool\\", \\"name\\": \\"exists\\", \\"type\\": \\"bool\\"}, {\\"internalType\\": \\"uint256\\", \\"name\\": \\"timestamp\\", \\"type\\": \\"uint256\\"}], \\"internalType\\": \\"struct TweetData\\", \\"name\\": \\"tweetData\\", \\"type\\": \\"tuple\\"}`;

// Configuration constants
const attestationTypeBase = "Web2Json";
const sourceIdBase = "testnet";
const verifierUrlBase = WEB2JSON_VERIFIER_URL_TESTNET || "https://verifier-testnet.flare.network/";

/**
 * Prepare attestation request for tweet verification
 */
async function prepareAttestationRequest(tweetId: string) {
    console.log(`\n🔍 Preparing attestation request for tweet: ${tweetId}`);
    
    // Construct the API URL for verify-tweet endpoint
    const apiUrl = `${baseApiUrl}/api/v1/verify-tweet?url=${tweetId}`;
    console.log(`🌐 API URL: ${apiUrl}`);
    
    // Format request body as JSON string according to Flare documentation
    const requestBody = JSON.stringify({
        url: apiUrl,
        httpMethod: httpMethod,
        headers: headers,
        queryParams: queryParams,
        body: body,
        postProcessJq: postProcessJq,
        abiSignature: abiSignature,
    });

    const url = `${verifierUrlBase}Web2Json/prepareRequest`;
    const apiKey = VERIFIER_API_KEY_TESTNET as string;
    
    if (!apiKey) {
        throw new Error("❌ VERIFIER_API_KEY_TESTNET not found in environment variables");
    }
    
    return await prepareAttestationRequestBase(url, apiKey, attestationTypeBase, sourceIdBase, requestBody);
}

/**
 * Retrieve data and proof from DA layer
 */
async function retrieveDataAndProof(abiEncodedRequest: string, roundId: number) {
    const url = `${COSTON2_DA_LAYER_URL || "https://coston2-data-layer.flare.network/"}api/v1/fdc/proof-by-request-round-raw`;
    console.log(`📡 Retrieval URL: ${url}`);
    return await retrieveDataAndProofBaseWithRetry(url, abiEncodedRequest, roundId);
}

/**
 * Deploy or get existing SwagFormProofManager contract
 */
async function deploySwagFormProofManager() {
    console.log("\n🚀 Deploying/Loading SwagFormProofManager contract...");
    
    const [deployer] = await ethers.getSigners();
    console.log(`👤 Deploying with account: ${deployer.address}`);
    
    // Check if we can find an existing deployment
    try {
        const SwagFormProofManagerFactory = await ethers.getContractFactory("SwagFormProofManager");
        
        // Deploy new contract
        console.log("📦 Deploying new SwagFormProofManager contract...");
        const swagFormProofManager = await SwagFormProofManagerFactory.deploy();
        await swagFormProofManager.waitForDeployment();
        
        const contractAddress = await swagFormProofManager.getAddress();
        console.log(`✅ SwagFormProofManager deployed at: ${contractAddress}`);
        
        // Save deployment info
        const deploymentData = {
            address: contractAddress,
            deployer: deployer.address,
            timestamp: new Date().toISOString(),
            network: hre.network.name
        };
        
        const deploymentPath = path.join(__dirname, "../deployments/SwagFormProofManager.json");
        fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
        
        return swagFormProofManager;
    } catch (error) {
        console.error("❌ Deployment failed:", error);
        throw error;
    }
}

/**
 * Interact with the contract to verify tweet data
 */
async function verifyTweetWithContract(contract: any, proof: any, tweetId: string) {
    console.log("\n🔗 Verifying tweet data on-chain...");
    console.log(`📄 Proof data: ${proof.response_hex.substring(0, 100)}...`);

    try {
        // The proof structure from DA layer
        const proofStruct = {
            merkleProof: proof.proof,
            data: {
                responseBody: {
                    abiEncodedData: proof.response_hex
                }
            }
        };
        
        // Call verifyTweetData function
        const tx = await contract.verifyTweetData(proofStruct);
        console.log(`📝 Transaction hash: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`✅ Tweet verified successfully! Gas used: ${receipt.gasUsed}`);
        
        // Optional: Link to a test form
        console.log("\n🔗 Linking proof to test form...");
        const linkTx = await contract.linkProofToQuestion(1, 0, tweetId);
        await linkTx.wait();
        console.log(`✅ Proof linked to form 1, question 0`);
        
        // Check verification status
        const [deployer] = await ethers.getSigners();
        const isVerified = await contract.isProofVerifiedForUser(1, 0, deployer.address);
        console.log(`✅ Verification status: ${isVerified ? "VERIFIED" : "NOT VERIFIED"}`);
        
        return true;
    } catch (error) {
        console.error("❌ Contract interaction failed:", error);
        throw error;
    }
}

/**
 * Test the complete tweet verification flow
 */
async function testTweetVerification(tweetId: string) {
    console.log(`\n🎯 === Testing Tweet Verification for ID: ${tweetId} ===`);
    
    try {
        // Step 1: Deploy contract
        console.log("\n📋 Step 1: Deploying contract...");
        const contract = await deploySwagFormProofManager();
        
        // Step 2: Prepare attestation request
        console.log("\n📋 Step 2: Preparing attestation request...");
        const attestationData = await prepareAttestationRequest(tweetId);
        console.log(`✅ Attestation request prepared`);

        // Step 3: Submit attestation request
        console.log("\n📋 Step 3: Submitting attestation request...");
        const abiEncodedRequest = attestationData.abiEncodedRequest;
        const roundId = await submitAttestationRequest(abiEncodedRequest);
        console.log(`✅ Attestation submitted for round: ${roundId}`);

        // Step 4: Retrieve proof
        console.log("\n📋 Step 4: Retrieving proof...");
        const proof = await retrieveDataAndProof(abiEncodedRequest, roundId);
        console.log(`✅ Proof retrieved successfully`);

        // Step 5: Verify on contract
        console.log("\n📋 Step 5: Verifying on contract...");
        await verifyTweetWithContract(contract, proof, tweetId);
        
        console.log(`\n🎉 === Tweet verification completed successfully! ===`);
        return contract;
        
    } catch (error: any) {
        console.error(`\n❌ === Tweet verification failed: ${error.message} ===`);
        throw error;
    }
}

/**
 * Test manual verification (for development)
 */
async function testManualVerification(contract: any, tweetId: string) {
    console.log(`\n🔧 Testing manual verification for tweet: ${tweetId}`);
    
    try {
        const tx = await contract.manualVerifyTweet(
            tweetId,
            true,
            "test_user",
            "This is a test tweet content"
        );
        
        await tx.wait();
        console.log(`✅ Manual verification completed`);
        
        // Check verification
        const isVerified = await contract.isTweetVerified(tweetId);
        console.log(`✅ Tweet verification status: ${isVerified ? "VERIFIED" : "NOT VERIFIED"}`);
        
        return true;
    } catch (error: any) {
        console.error(`❌ Manual verification failed: ${error.message}`);
        throw error;
    }
}

/**
 * Main execution function
 */
async function main() {
    console.log("🚀 SwagForm Tweet Verification System");
    console.log("=====================================");
    
    try {
        // Test tweet ID from your example
        const testTweetId = "1940801319423623380";
        
        // Test the complete flow
        const contract = await testTweetVerification(testTweetId);
        
        // Optional: Test manual verification with a different tweet
        await testManualVerification(contract, "1234567890123456789");
        
        console.log("\n🎯 All tests completed successfully!");
        
    } catch (error) {
        console.error("\n💥 Script execution failed:", error);
        process.exit(1);
    }
}

// Export functions for individual testing
export {
    testTweetVerification,
    deploySwagFormProofManager,
    prepareAttestationRequest,
    retrieveDataAndProof,
    testManualVerification
};

// Execute if run directly
if (require.main === module) {
    main()
        .then(() => {
            console.log("\n✅ Script completed successfully!");
            process.exit(0);
        })
        .catch((error) => {
            console.error("\n❌ Script failed:", error);
            process.exit(1);
        });
} 