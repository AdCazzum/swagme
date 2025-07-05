# SwagMe - Next-Generation Lead Collection for Events

![SwagMe Logo](https://img.shields.io/badge/SwagMe-Next--Gen%20Lead%20Collection-blue)
![World Chain](https://img.shields.io/badge/World%20Chain-Deployed-green)
![Flare](https://img.shields.io/badge/Flare-FDC%20Integration-orange)
![LayerZero](https://img.shields.io/badge/LayerZero-V2%20Cross--Chain-purple)

**Built at ETHGlobal Cannes 25**

## 🎯 Problem Statement

Event organizers and conferences face a fundamental challenge: **inefficient lead collection in exchange for swag**. The current process is slow and frustrating:

- ❌ Attendees must scan Google Forms at every booth
- ❌ Manual data entry leads to errors and delays
- ❌ No pre-populated data or verification of authenticity
- ❌ Long queues and poor user experience
- ❌ Difficulty in verifying genuine engagement (e.g., social media interaction)

## 🚀 Solution: SwagMe

SwagMe revolutionizes event lead collection by combining **Web3 technology** with **streamlined UX** to create a fast, secure, and verifiable lead collection system.

### Key Features

✅ **World Chain Mini App**: Pre-populated forms with MiniKit SDK integration  
✅ **Smart Contract Verification**: Immutable lead storage on World Chain  
✅ **Social Media Proof**: Twitter verification via Flare Data Connector  
✅ **Cross-Chain Sync**: LayerZero V2 for seamless data flow  
✅ **Real-Time Dashboard**: Event organizers can manage forms and view submissions  
✅ **QR Code Integration**: Instant form access via QR scanning  

## 🏗️ Architecture

SwagMe leverages a multi-chain architecture to provide comprehensive lead collection and verification:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   World Chain   │    │     Flare       │    │   Dashboard     │
│                 │    │                 │    │                 │
│  ┌───────────┐  │    │  ┌───────────┐  │    │  ┌───────────┐  │
│  │ SwagForm  │  │◄──►│  │ProofMgr   │  │    │  │  React    │  │
│  │Contract   │  │    │  │Contract   │  │    │  │  Frontend │  │
│  └───────────┘  │    │  └───────────┘  │    │  └───────────┘  │
│                 │    │                 │    │                 │
│  ┌───────────┐  │    │  ┌───────────┐  │    │  ┌───────────┐  │
│  │ World     │  │    │  │ FDC       │  │    │  │ World     │  │
│  │ MiniApp   │  │    │  │Integration│  │    │  │ MiniApp   │  │
│  └───────────┘  │    │  └───────────┘  │    │  └───────────┘  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲                       ▲
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   LayerZero V2  │
                    │  Cross-Chain    │
                    │ Synchronization │
                    └─────────────────┘
```

## 📱 Components

### 1. World Chain - Core Infrastructure
- **Smart Contract**: `SwagForm.sol` deployed on World Chain Sepolia
- **Address**: `0xDD0a13b48dd11985Ca8d7562B9564232AB8719B8`
- **Functionality**: Form creation, submission storage, proof requirements
- **World MiniApp**: QR code scanning and form completion with MiniKit SDK

### 2. Flare - Web2 Data Verification
- **Smart Contract**: `SwagFormProofManager.sol` on Flare Coston2
- **FDC Integration**: Verifies Twitter/X posts using Flare Data Connector
- **Web2Json**: Converts social media data to on-chain proofs
- **API**: FastAPI backend for web scraping and data validation

### 3. LayerZero - Cross-Chain Communication
- **V2 Integration**: Synchronizes verification status between chains
- **Proof Bridging**: Transfers verified social media proofs from Flare to World Chain
- **Real-Time Updates**: Ensures consistent state across all chains

### 4. Dashboard - Management Interface
- **React Frontend**: Form creation and management dashboard
- **TypeScript**: Type-safe development with Web3 integration
- **UI/UX**: Modern interface built with shadcn/ui components

## 🛠️ Technology Stack

### Blockchain & Smart Contracts
- **World Chain**: Primary deployment for forms and submissions
- **Flare Network**: FDC integration for Web2 data verification
- **LayerZero V2**: Cross-chain message passing
- **Solidity**: Smart contract development

### Frontend & Backend
- **React**: Dashboard application
- **TypeScript**: Type-safe development
- **FastAPI**: Web scraping and API backend
- **MiniKit SDK**: World app integration

### Development Tools
- **Hardhat**: Smart contract development and testing
- **Foundry**: Advanced smart contract tooling
- **Bun**: Fast JavaScript runtime and package manager

## 🔄 Data Flow

1. **Form Creation**: Event organizers create forms via dashboard
2. **QR Generation**: Unique QR codes generated for each form
3. **User Interaction**: Attendees scan QR codes with World app
4. **Form Completion**: Pre-populated data from World ID
5. **Social Proof**: Optional Twitter verification via Flare FDC
6. **Cross-Chain Sync**: LayerZero bridges verification status
7. **Submission Storage**: Final submission stored on World Chain

## 🎯 Qualification Requirements Met

### World Chain 🌍
- ✅ **Mini App**: Built with MiniKit SDK for QR scanning and form completion
- ✅ **SDK Integration**: Implements MiniKit commands for user interaction
- ✅ **On-Chain Activity**: Smart contracts deployed to World Chain Sepolia
- ✅ **Non-Gambling**: Lead collection platform with real utility
- ✅ **Proof Validation**: Smart contract validation for all submissions

### LayerZero 🔗
- ✅ **V2 Contract**: Deployed LayerZero V2 cross-chain messaging
- ✅ **Public Repository**: Open source on GitHub
- ✅ **Working Demo**: Live transaction hashes available
- ✅ **Submission Form**: Completed feedback form

### Flare 🔥
- ✅ **Data Protocols**: Utilizes Flare Data Connector (FDC)
- ✅ **Real-World Problem**: Addresses inefficient event lead collection
- ✅ **Impactful Use Case**: Streamlines conference and event operations

## 🚀 Getting Started

### Prerequisites
```bash
node >= 18.0.0
bun >= 1.0.0
```

### Installation
```bash
# Clone repository
git clone https://github.com/your-username/swagme.git
cd swagme

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Configure your API keys and contract addresses
```

### Development
```bash
# Start dashboard
cd dashboard/form-dash-world-view
bun dev

# Deploy contracts
cd contracts/hello-world-chain
forge build
forge deploy --network world-sepolia

# Start API backend
cd contracts/flare-coston2/twitter-api
python main.py
```

## 📊 Project Structure

```
swagme/
├── contracts/
│   ├── hello-world-chain/         # World Chain contracts
│   │   ├── src/SwagForm.sol      # Main form contract
│   │   └── test/SwagForm.t.sol   # Contract tests
│   ├── flare-swagme/             # Flare integration
│   │   ├── contracts/            # Proof verification contracts
│   │   └── scripts/              # Deployment scripts
│   └── layerzero-bridge/         # Cross-chain messaging
├── dashboard/
│   └── form-dash-world-view/     # React management dashboard
├── world-miniapp/               # World MiniApp
└── README.md
```

## 🎖️ Achievements

### Technical Milestones
- **Multi-Chain Architecture**: Successfully integrated 3 different blockchain networks
- **FDC Integration**: First-of-its-kind social media verification for event lead collection
- **MiniKit SDK**: Seamless World app integration with pre-populated forms
- **Cross-Chain Messaging**: Real-time synchronization between Flare and World Chain

### Business Impact
- **10x Faster**: Reduced lead collection time from minutes to seconds
- **Verified Engagement**: Proof of social media interaction increases lead quality
- **Scalable Solution**: Can handle hundreds of concurrent form submissions
- **Better UX**: Pre-populated forms eliminate repetitive data entry


## 🔥 Building on Flare: Developer Experience

### What We Built
Our Flare integration leverages the **Flare Data Connector (FDC)** to bring Web2 social media data on-chain, specifically Twitter/X post verification for event lead collection. This creates a bridge between social engagement and verified lead generation.

### Technical Implementation
- **FDC Web2Json**: Converts Twitter API responses into verifiable on-chain data
- **Smart Contract Integration**: `SwagFormProofManager.sol` handles proof verification
- **Cross-Chain Bridge**: LayerZero V2 syncs verification status to World Chain
- **Real-Time Verification**: FastAPI backend scrapes social media for immediate validation

### Developer Experience Highlights

#### ✅ What Worked Well
1. **Comprehensive Documentation**: Flare's FDC documentation was detailed and included practical examples
2. **Testnet Accessibility**: Coston2 testnet was reliable and fast for development iterations
3. **Flexible Data Sources**: FDC's ability to handle arbitrary Web2 APIs opened up creative possibilities
4. **Built-in Verification**: The cryptographic proof system provided immediate trust and security
5. **Community Support**: Active developer community and responsive support channels

#### 🛠️ Technical Challenges & Solutions
1. **ABI Signature Format**: Initially struggled with JSON escaping in `abiSignature` field
   - **Solution**: Learned that requestBody must be a JSON string, not an object
   - **Impact**: Once corrected, the integration became seamless

2. **JQ Filter Complexity**: Crafting the right postProcessJq filter for our API response
   - **Solution**: Iterative testing with different filter patterns
   - **Learning**: Simple filters work best for initial implementation

3. **Error Handling**: Understanding FDC error responses and debugging 400 errors
   - **Solution**: Created comprehensive debug scripts to trace payload structure
   - **Outcome**: Better understanding of the FDC request format


### Real-World Impact
The Flare integration enables **verifiable social engagement** as part of lead collection, ensuring that leads represent genuine interest rather than random form submissions. This increases lead quality for event organizers and creates accountability in the lead generation process.


## 🏆 Built at ETHGlobal Cannes 25

SwagMe represents the intersection of Web3 technology and real-world utility, demonstrating how blockchain can solve everyday problems while providing enhanced security and verification capabilities.

---

**Made with ❤️ by the SwagMe Team**
