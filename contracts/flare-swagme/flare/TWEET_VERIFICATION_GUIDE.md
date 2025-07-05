# SwagForm Tweet Verification with Flare Data Connector

This guide explains how to use the SwagForm tweet verification system integrated with Flare Data Connector for decentralized Web2 data verification.

## 🏗️ Architecture Overview

```
User Tweet URL → Local Scraping API → Flare Data Connector → SwagFormProofManager → World Chain Form Verification
```

1. **User provides tweet URL** in SwagForm
2. **Scraping API** verifies tweet existence (no API keys needed!)
3. **Flare Data Connector** creates cryptographic proof
4. **SwagFormProofManager** validates and stores proof on Flare Coston2
5. **World Chain contract** checks verification status

## 🚀 Quick Start

### 1. Prerequisites

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your keys (no Twitter API keys needed!)
```

### 2. Start Twitter Scraping API

```bash
cd ../../../contracts/flare-coston2/twitter-api
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Deploy SwagFormProofManager Contract

```bash
# Using the new script
npx hardhat run scripts/tweetVerificationDeploy.ts --network coston2

# Or using the updated fdcDeploy script
npx hardhat run scripts/fdcDeploy.ts --network coston2
```

## 📋 Environment Setup

Create `.env` file with:

```env
# Flare Data Connector Configuration (REQUIRED)
WEB2JSON_VERIFIER_URL_TESTNET=https://verifier-testnet.flare.network/
VERIFIER_API_KEY_TESTNET=your_verifier_api_key_here
COSTON2_DA_LAYER_URL=https://coston2-data-layer.flare.network/

# Wallet Configuration (REQUIRED)
PRIVATE_KEY=your_private_key_here

# Network URLs
COSTON2_RPC_URL=https://coston2-api.flare.network/ext/bc/C/rpc

# Twitter Scraping API (Local)
TWITTER_API_BASE_URL=http://localhost:8000
```

## 🔧 API Configuration

### Our Scraping API Response Format

```json
{
  "verified": true,
  "tweet_id": "1940801319423623380",
  "data": {
    "tweetId": "1940801319423623380",
    "authorUsername": "srv",
    "tweetText": "width=device-width, initial-scale=1",
    "createdAt": "",
    "exists": true,
    "timestamp": 1751728083
  },
  "message": "Tweet verified successfully"
}
```

### Flare Data Connector Configuration

- **API URL**: `http://localhost:8000/api/v1/verify-tweet?url={tweetId}`
- **HTTP Method**: `GET`
- **Post-process JQ**: `{tweetId: .data.tweetId, authorUsername: .data.authorUsername, tweetText: .data.tweetText, createdAt: .data.createdAt, exists: .data.exists, timestamp: .data.timestamp}`

## 📝 Smart Contract Functions

### SwagFormProofManager Contract

#### Core Verification Functions

```solidity
// Verify tweet using FDC proof
function verifyTweetData(IWeb2Json.Proof memory proof) external

// Link verified tweet to form question
function linkProofToQuestion(uint256 formId, uint256 questionIndex, string memory tweetId) external

// Check if proof is verified for user
function isProofVerifiedForUser(uint256 formId, uint256 questionIndex, address user) external view returns (bool)

// Get tweet data for user
function getTweetDataForUser(uint256 formId, uint256 questionIndex, address user) external view returns (TweetData memory)
```

#### Data Structures

```solidity
struct TweetData {
    string tweetId;
    string authorUsername;
    string tweetText;
    string createdAt;
    bool exists;
    uint256 timestamp;
    bool verified;
}
```

## 🎯 Complete Verification Workflow

### Step 1: Prepare Attestation Request

```typescript
const attestationData = await prepareAttestationRequest(tweetId);
```

### Step 2: Submit to Flare Data Connector

```typescript
const roundId = await submitAttestationRequest(attestationData.abiEncodedRequest);
```

### Step 3: Retrieve Cryptographic Proof

```typescript
const proof = await retrieveDataAndProof(abiEncodedRequest, roundId);
```

### Step 4: Verify On-Chain

```typescript
await contract.verifyTweetData(proof);
await contract.linkProofToQuestion(formId, questionIndex, tweetId);
```

## 🧪 Testing

### Test Complete Flow

```bash
# Deploy and test with specific tweet
npx hardhat run scripts/tweetVerificationDeploy.ts --network coston2

# Test with your own tweet ID
TWEET_ID="1940801319423623380" npx hardhat run scripts/fdcDeploy.ts --network coston2
```

### Test Manual Verification (Development)

```typescript
await contract.manualVerifyTweet(
    tweetId,
    true,
    "username",
    "tweet content"
);
```

### Test API Directly

```bash
# Test scraping functionality
curl http://localhost:8000/api/v1/scraping/test

# Test specific tweet
curl "http://localhost:8000/api/v1/verify-tweet?url=1940801319423623380"

# Debug scraping for specific tweet
curl "http://localhost:8000/api/v1/scraping/debug/1940801319423623380"
```

## 🔄 Integration with SwagForm

### Frontend Integration

The dashboard will:
1. Show "Twitter Proof Required" for specific questions
2. Display TwitterProofGuide component with instructions
3. Allow users to input tweet URLs
4. Show verification status with badges

### Cross-Chain Verification

1. **Form Creation**: World Chain form includes `requiresProof` field
2. **User Submission**: User provides tweet URL in frontend
3. **Proof Generation**: System generates FDC proof on Flare
4. **Verification**: World Chain checks Flare for proof status

## 📊 Monitoring and Debugging

### Contract Events

```solidity
event TweetVerified(uint256 indexed formId, uint256 indexed questionIndex, address indexed user, string tweetId, bool exists, uint256 timestamp);
event ProofLinked(uint256 indexed formId, uint256 indexed questionIndex, address indexed user, string tweetId);
```

### API Monitoring

```bash
# Check API status
curl http://localhost:8000/api/v1/status

# Test scraping capability
curl http://localhost:8000/api/v1/scraping/test
```

### Network Monitoring

- **Flare Coston2 Explorer**: https://coston2-explorer.flare.network/
- **FDC Round Progress**: Check round status for attestation progress

## 🚨 Security Considerations

1. **Proof Validation**: All FDC proofs are cryptographically verified on-chain
2. **Tweet Existence**: System verifies actual tweet existence via scraping
3. **No API Dependencies**: No external API keys required for basic functionality
4. **Decentralized**: Verification happens through Flare's decentralized network

## 🔗 Network Information

### Flare Coston2 Testnet

- **Chain ID**: 114
- **RPC URL**: https://coston2-api.flare.network/ext/bc/C/rpc
- **Explorer**: https://coston2-explorer.flare.network/
- **Faucet**: https://coston2-faucet.flare.network/

### Contract Registry

- **Flare Contract Registry**: `0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019`

## 🛠️ Troubleshooting

### Common Issues

1. **"Invalid FDC proof"**: Check that the proof structure matches expected format
2. **"Tweet not verified"**: Ensure tweet exists and scraping API is running
3. **"Round not finalized"**: Wait for Flare voting round to complete (usually 90 seconds)

### Debug Commands

```bash
# Check if contracts are deployed
npx hardhat run scripts/checkDeployment.ts --network coston2

# Test manual verification
npx hardhat run scripts/testManual.ts --network coston2

# Check API connectivity
curl http://localhost:8000/api/v1/status
```

## 📚 Additional Resources

- [Flare Data Connector Documentation](https://dev.flare.network/fdc/)
- [Flare Network Developer Docs](https://dev.flare.network/)
- [SwagForm Project Repository](https://github.com/your-repo/swagform)

---

*Built with ❤️ using Flare Data Connector for decentralized Web2 data verification* 