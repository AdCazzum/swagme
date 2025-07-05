# Simple Health Check Verification Guide

## Overview

This is a simplified implementation of SwagForm proof verification using Flare Data Connector (FDC) that verifies health check responses instead of complex Twitter data.

## Architecture

### Smart Contract: `SimpleHealthProofManager.sol`

A simplified version of the proof manager that handles:
- Health check data verification using FDC
- Proof linking to form questions
- Simple status tracking ("healthy" vs other statuses)

### Key Features

1. **Health Data Structure**:
   ```solidity
   struct HealthData {
       string status;        // "healthy" or other status
       string timestamp;     // ISO timestamp
       bool isHealthy;       // computed from status
       bool verified;        // verification status
   }
   ```

2. **API Endpoint**: `http://localhost:8000/health`
3. **Expected Response**: 
   ```json
   {
     "status": "healthy",
     "timestamp": "2025-07-05T16:27:19.969529"
   }
   ```

## Setup and Usage

### 1. Environment Variables

Make sure you have these environment variables set:
```bash
WEB2JSON_VERIFIER_URL_TESTNET="https://verifier-testnet.flare.network/"
VERIFIER_API_KEY_TESTNET="your_api_key_here"
COSTON2_DA_LAYER_URL="https://coston2-data-layer.flare.network/"
```

### 2. Deploy and Test

```bash
# Deploy the simplified contract and run tests
npx hardhat run scripts/simpleHealthDeploy.ts --network coston2
```

### 3. Test Flow

The script performs these steps:

1. **Deploy Contract**: Deploys `SimpleHealthProofManager` to Coston2
2. **Prepare Request**: Creates FDC attestation request for health endpoint
3. **Submit Request**: Submits to FDC for verification
4. **Retrieve Proof**: Gets cryptographic proof from DA layer
5. **Verify On-Chain**: Verifies proof and links to form question
6. **Manual Tests**: Tests manual verification functions

### 4. FDC Configuration

The script uses this FDC configuration:

```typescript
// API endpoint to verify
const apiUrl = "http://localhost:8000/health";

// JQ filter to extract relevant data
const postProcessJq = `{status: .status, timestamp: .timestamp}`;

// ABI signature for Solidity struct
const abiSignature = `{"components": [
  {"internalType": "string", "name": "status", "type": "string"},
  {"internalType": "string", "name": "timestamp", "type": "string"}
], "internalType": "struct HealthData", "name": "healthData", "type": "tuple"}`;
```

## Key Functions

### Smart Contract Functions

```solidity
// Verify health data using FDC proof
function verifyHealthData(IWeb2Json.Proof memory proof) external

// Link verified proof to form question
function linkProofToQuestion(uint256 formId, uint256 questionIndex, string memory timestamp) external

// Check if proof is verified for user
function isProofVerifiedForUser(uint256 formId, uint256 questionIndex, address user) external view returns (bool)

// Manual verification for testing
function manualVerifyHealthCheck(string memory status, string memory timestamp) external
```

### Script Functions

```typescript
// Deploy contract
await deploySimpleHealthProofManager();

// Test complete FDC flow
await testHealthVerification();

// Test manual verification
await testManualVerification(contract);

// Test with mocked response
await testWithMockedResponse(contract);
```

## Testing Without API

The script includes fallback testing that works even if the health API is not available:

1. **Manual Verification**: Uses `manualVerifyHealthCheck()` to simulate verification
2. **Mocked Response**: Tests with the expected response format
3. **Contract Deployment**: Always attempts to deploy the contract

## Troubleshooting

### Common Issues

1. **400 Error on FDC Request**:
   - Check that `abiSignature` is properly escaped JSON
   - Verify API endpoint returns expected format
   - Ensure `postProcessJq` filter matches response structure

2. **Contract Deployment Fails**:
   - Check network configuration
   - Verify account has sufficient funds
   - Ensure contract compiles without errors

3. **FDC Verification Fails**:
   - Check that verifier API key is valid
   - Verify network connectivity to FDC services
   - Check that the API endpoint is accessible

### Debug Commands

```bash
# Test contract compilation
npx hardhat compile

# Check network configuration
npx hardhat network --network coston2

# Run script with verbose output
npx hardhat run scripts/simpleHealthDeploy.ts --network coston2 --verbose
```

## Expected Output

Successful execution should show:

```
🚀 SwagForm Simple Health Check Verification System
==================================================

📋 Step 1: Deploying contract...
✅ SimpleHealthProofManager deployed at: 0x...

📋 Step 2: Preparing attestation request...
✅ Attestation request prepared

📋 Step 3: Submitting attestation request...
✅ Attestation submitted for round: 123

📋 Step 4: Retrieving proof...
✅ Proof retrieved successfully

📋 Step 5: Verifying on contract...
✅ Health check verified successfully!
✅ Proof linked to form 1, question 0
✅ Verification status: VERIFIED

🎯 All tests completed successfully!
```

## Next Steps

Once this simplified version works:

1. **Expand to Twitter**: Use the same pattern for Twitter verification
2. **Add UI Integration**: Connect to dashboard for user interaction
3. **Production Deploy**: Deploy to mainnet with proper API endpoints
4. **Multiple Endpoints**: Support different verification types

This simplified version provides a foundation for understanding FDC integration without the complexity of Twitter API scraping. 