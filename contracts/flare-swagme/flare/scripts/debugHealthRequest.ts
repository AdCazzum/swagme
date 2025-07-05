import { ethers } from "hardhat";

// Environment variables
const { WEB2JSON_VERIFIER_URL_TESTNET, VERIFIER_API_KEY_TESTNET } = process.env;

// Health check API configuration
const baseApiUrl = "http://localhost:8000";
const postProcessJq = `{status: .status, timestamp: .timestamp}`;
const httpMethod = "GET";
const headers = "{}";
const queryParams = "{}";
const body = "{}";

// ABI signature for HealthData struct - escaped JSON string
const abiSignature = `{\\"components\\": [{\\"internalType\\": \\"string\\", \\"name\\": \\"status\\", \\"type\\": \\"string\\"}, {\\"internalType\\": \\"string\\", \\"name\\": \\"timestamp\\", \\"type\\": \\"string\\"}], \\"internalType\\": \\"struct HealthData\\", \\"name\\": \\"healthData\\", \\"type\\": \\"tuple\\"}`;

// Configuration constants
const attestationTypeBase = "Web2Json";
const sourceIdBase = "testnet";
const verifierUrlBase = WEB2JSON_VERIFIER_URL_TESTNET || "https://verifier-testnet.flare.network/";

// Helper functions from Base.ts
function toHex(data: string) {
    let result = "";
    for (let i = 0; i < data.length; i++) {
        result += data.charCodeAt(i).toString(16);
    }
    return result.padEnd(64, "0");
}

function toUtf8HexString(data: string) {
    return "0x" + toHex(data);
}

async function debugPrepareAttestationRequest(useStringRequestBody: boolean = true) {
    console.log(`🔍 Debug: Preparing attestation request (requestBody as ${useStringRequestBody ? 'JSON string' : 'object'})...\n`);
    
    // API endpoint
    const apiUrl = `${baseApiUrl}/health`;
    console.log(`🌐 API URL: ${apiUrl}`);
    
    // Convert to hex strings
    const attestationType = toUtf8HexString(attestationTypeBase);
    const sourceId = toUtf8HexString(sourceIdBase);
    
    console.log(`📄 Attestation Type: ${attestationTypeBase} -> ${attestationType}`);
    console.log(`📄 Source ID: ${sourceIdBase} -> ${sourceId}`);
    
    // Request body structure
    const requestBodyObj = {
        url: apiUrl,
        httpMethod: httpMethod,
        headers: headers,
        queryParams: queryParams,
        body: body,
        postProcessJq: postProcessJq,
        abiSignature: abiSignature,
    };
    
    // Use either string or object based on parameter
    const requestBody = useStringRequestBody ? JSON.stringify(requestBodyObj) : requestBodyObj;
    
    console.log(`\n📋 Request Body (${useStringRequestBody ? 'as JSON string' : 'as object'}):`);
    if (useStringRequestBody) {
        console.log(requestBody);
    } else {
        console.log(JSON.stringify(requestBody, null, 2));
    }
    
    // Final payload to verifier
    const payload = {
        attestationType: attestationType,
        sourceId: sourceId,
        requestBody: requestBody,
    };
    
    console.log(`\n📦 Final Payload to Verifier:`);
    console.log(JSON.stringify(payload, null, 2));
    
    // Headers for the request
    const apiKey = VERIFIER_API_KEY_TESTNET as string;
    const requestHeaders = {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
    };
    
    console.log(`\n🔑 Request Headers:`);
    console.log(JSON.stringify(requestHeaders, null, 2));
    
    // URL for the request
    const url = `${verifierUrlBase}Web2Json/prepareRequest`;
    console.log(`\n🌐 Verifier URL: ${url}`);
    
    // Make the actual request
    console.log(`\n🚀 Making request to verifier...`);
    
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: requestHeaders,
            body: JSON.stringify(payload),
        });
        
        console.log(`\n📊 Response Status: ${response.status} ${response.statusText}`);
        console.log(`📊 Response Headers:`);
        for (const [key, value] of response.headers.entries()) {
            console.log(`  ${key}: ${value}`);
        }
        
        const responseText = await response.text();
        console.log(`\n📄 Response Body:`);
        console.log(responseText);
        
        if (response.status !== 200) {
            console.log(`\n❌ Error ${response.status}: ${response.statusText}`);
            
            // Try to parse error response
            try {
                const errorData = JSON.parse(responseText);
                console.log(`\n🔍 Parsed Error Data:`);
                console.log(JSON.stringify(errorData, null, 2));
            } catch (e) {
                console.log(`\n⚠️  Could not parse error response as JSON`);
            }
            
            return false;
        }
        
        // Try to parse success response
        try {
            const successData = JSON.parse(responseText);
            console.log(`\n✅ Success Data:`);
            console.log(JSON.stringify(successData, null, 2));
            return successData;
        } catch (e) {
            console.log(`\n⚠️  Could not parse success response as JSON`);
            return responseText;
        }
        
    } catch (error) {
        console.error(`\n💥 Request failed:`, error);
        return false;
    }
}

// Test different variations
async function testVariations() {
    console.log(`\n🧪 Testing different payload variations...\n`);
    
    // Test 1: requestBody as JSON string (correct according to Flare docs)
    console.log(`\n📝 Test 1: requestBody as JSON string`);
    await debugPrepareAttestationRequest(true);
    
    // Test 2: requestBody as object (our previous approach)
    console.log(`\n📝 Test 2: requestBody as object`);
    await debugPrepareAttestationRequest(false);
    
    // Test 3: Check if our health API is accessible
    console.log(`\n📝 Test 3: Testing health API accessibility`);
    try {
        const healthResponse = await fetch(`${baseApiUrl}/health`);
        console.log(`Health API Status: ${healthResponse.status}`);
        if (healthResponse.ok) {
            const healthData = await healthResponse.text();
            console.log(`Health API Response: ${healthData}`);
        }
    } catch (error) {
        console.log(`Health API Error: ${error}`);
    }
    
    // Test 4: Verify abiSignature format
    console.log(`\n📝 Test 4: ABI Signature validation`);
    console.log(`ABI Signature length: ${abiSignature.length}`);
    console.log(`ABI Signature: ${abiSignature}`);
    
    // Try to parse it as JSON to make sure it's valid
    try {
        const parsed = JSON.parse(abiSignature);
        console.log(`✅ ABI Signature is valid JSON`);
        console.log(`Components count: ${parsed.components.length}`);
    } catch (e) {
        console.log(`❌ ABI Signature is not valid JSON: ${e}`);
    }
}

async function main() {
    console.log("🔍 Health Check Verifier Debug Tool");
    console.log("=====================================");
    
    if (!VERIFIER_API_KEY_TESTNET) {
        console.log("❌ VERIFIER_API_KEY_TESTNET not found in environment variables");
        return;
    }
    
    if (!WEB2JSON_VERIFIER_URL_TESTNET) {
        console.log("❌ WEB2JSON_VERIFIER_URL_TESTNET not found in environment variables");
        return;
    }
    
    await testVariations();
}

// Execute if run directly
if (require.main === module) {
    main()
        .then(() => {
            console.log("\n✅ Debug completed!");
            process.exit(0);
        })
        .catch((error) => {
            console.error("\n❌ Debug failed:", error);
            process.exit(1);
        });
} 