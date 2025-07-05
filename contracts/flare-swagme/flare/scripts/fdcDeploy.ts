import { ethers, run, web3 } from "hardhat";
import { prepareAttestationRequestBase, submitAttestationRequest, retrieveDataAndProofBaseWithRetry } from "./Base";
import path from "path";
import fs from "fs";

// const SwagFormProofManager = artifacts.require("SwagFormProofManager");

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
const verifierUrlBase = WEB2JSON_VERIFIER_URL_TESTNET;

async function prepareAttestationRequest(tweetId: string) {
    console.log(`Preparing attestation request for tweet: ${tweetId}`);
    
    // Construct the API URL for verify-tweet endpoint
    const apiUrl = `${baseApiUrl}/api/v1/verify-tweet?url=${tweetId}`;
    console.log(`API URL: ${apiUrl}`);
    
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
    return await prepareAttestationRequestBase(url, apiKey, attestationTypeBase, sourceIdBase, requestBody);
}

async function retrieveDataAndProof(abiEncodedRequest: string, roundId: number) {
    const url = `${COSTON2_DA_LAYER_URL}api/v1/fdc/proof-by-request-round-raw`;
    console.log("Retrieval URL:", url, "\n");
    return await retrieveDataAndProofBaseWithRetry(url, abiEncodedRequest, roundId);
}

async function getSwagFormProofManagerContract() {
    const [deployer] = await ethers.getSigners();
    const deploymentPath = path.join(
        __dirname,
        `../ignition/deployments/chain-114/deployed_addresses.json`
    );
    
    let swagFormProofManagerAddress: string;
    
    try {
        // Try to load existing deployment
        const deploymentJson = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));
        swagFormProofManagerAddress = deploymentJson["SwagFormProofManager"];
        console.log(`Using existing SwagFormProofManager at: ${swagFormProofManagerAddress}`);
    } catch (error) {
        // Deploy new contract if deployment file doesn't exist
        console.log("Deploying new SwagFormProofManager contract...");
        const SwagFormProofManagerFactory = await ethers.getContractFactory("SwagFormProofManager");
        const swagFormProofManager = await SwagFormProofManagerFactory.deploy();
        await swagFormProofManager.waitForDeployment();
        swagFormProofManagerAddress = await swagFormProofManager.getAddress();
        
        // Save deployment address
        fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
        const deploymentData = { "SwagFormProofManager": swagFormProofManagerAddress };
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
        console.log(`SwagFormProofManager deployed at: ${swagFormProofManagerAddress}`);
    }
    
    // @ts-ignore
    const swagFormProofManager = await ethers.getContractAt("SwagFormProofManager", swagFormProofManagerAddress, deployer);
    return swagFormProofManager;
}

async function interactWithContract(proofManagerContract: any, proof: any, tweetId: string) {
    console.log("Proof hex:", proof.response_hex, "\n");

    // A piece of black magic that allows us to read the response type from an artifact
    const IWeb2JsonVerification = await artifacts.require("IWeb2JsonVerification");
    const responseType = IWeb2JsonVerification._json.abi[0].inputs[0].components[1];
    console.log("Response type:", responseType, "\n");

    const decodedResponse = web3.eth.abi.decodeParameter(responseType, proof.response_hex);
    console.log("Decoded proof:", decodedResponse, "\n");
    
    // Verify the tweet data using FDC proof
    const transaction = await proofManagerContract.verifyTweetData({
        merkleProof: proof.proof,
        data: decodedResponse,
    });
    console.log("Transaction:", transaction.hash, "\n");
    
    // Link to a test form (form ID 1, question 0)
    const linkTransaction = await proofManagerContract.linkProofToQuestion(1, 0, tweetId);
    console.log("Link transaction:", linkTransaction.hash, "\n");
    
    // Check verification status
    const [deployer] = await ethers.getSigners();
    const isVerified = await proofManagerContract.isProofVerifiedForUser(1, 0, deployer.address);
    console.log("Verification status:", isVerified, "\n");
}

async function main() {
    // Test tweet ID from your example
    const testTweetId = "1940801319423623380";
    
    console.log(`Testing tweet verification for ID: ${testTweetId}`);
    
    const data = await prepareAttestationRequest(testTweetId);
    console.log("Data:", data, "\n");

    const abiEncodedRequest = data.abiEncodedRequest;
    const roundId = await submitAttestationRequest(abiEncodedRequest);

    const proof = await retrieveDataAndProof(abiEncodedRequest, roundId);
    console.log("Proof:", proof, "\n");

    const proofManagerContract: any = await getSwagFormProofManagerContract();

    await interactWithContract(proofManagerContract, proof, testTweetId);
}

void main().then(() => {
    process.exit(0);
});