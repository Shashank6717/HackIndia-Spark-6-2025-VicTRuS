<<<<<<< HEAD
# HackIndia-Spark-6-2025-VicTRuS
=======
# Blockchain ePortfolio System

A decentralized ePortfolio system built on Ethereum blockchain (Mumbai testnet) that allows users to store their personal information and certificates securely on the blockchain.

## Features

- Create and manage user profiles on the blockchain
- Upload and store certificates with verification
- No MetaMask dependency - uses custom wallet implementation
- Built with Hardhat for Ethereum development
- Deployed on Mumbai testnet for testing

## Tech Stack

- **Blockchain**: Ethereum (Mumbai Testnet)
- **Smart Contract**: Solidity
- **Development Framework**: Hardhat
- **Backend**: Node.js with Express
- **Frontend**: HTML, CSS, JavaScript, Bootstrap
- **Web3 Library**: ethers.js

## Prerequisites

- Node.js (v14+)
- npm or yarn
- Access to Mumbai testnet

## Installation

1. Clone the repository:
```
git clone <repository-url>
cd blockchain-portfolio
```

2. Install dependencies:
```
npm install
```

3. Configure environment variables:
   - Create a `.env` file in the root directory
   - Add your Mumbai testnet private key and RPC URL:
```
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
PRIVATE_KEY=your_private_key_here_without_0x_prefix
PORT=3000
```

## Deployment

1. Compile the smart contracts:
```
npm run compile
```

2. Deploy to Mumbai testnet:
```
npm run deploy
```

3. After deployment, the contract address will be saved to `src/contracts/contract-address.json`

4. Update the contract info in `public/js/contract-info.json` with the deployed contract address

## Running the Application

Start the application server:
```
npm start
```

The application will be available at `http://localhost:3000`

## Project Structure

- `contracts/` - Solidity smart contracts
- `scripts/` - Deployment scripts
- `public/` - Static assets
  - `css/` - Stylesheets
  - `js/` - Frontend JavaScript
  - `uploads/` - Uploaded files
- `views/` - EJS templates
- `server.js` - Express server
- `hardhat.config.js` - Hardhat configuration

## Smart Contract

The main smart contract `EPortfolio.sol` handles:

1. User profile management
2. Certificate storage and verification
3. Data retrieval functions

## Usage

1. Visit the homepage and connect your wallet
2. Create your profile with personal information
3. Add certificates with details and upload certificate files
4. View and manage your certificates

## License

MIT
>>>>>>> aea4938 (first commit)
