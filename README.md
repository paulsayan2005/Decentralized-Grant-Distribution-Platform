# Decentralized Grant Distribution Platform

A premium decentralized crowdfunding and grant management platform built on the **Stellar network** using **Soroban smart contracts**, **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, **StellarWalletsKit**, **Zustand**, and **React Query**.

This platform enables creators to propose milestone-based grants, donors to fund projects securely using native XLM, and automatic release or refund operations governed by smart contract rules.

---

## 🚀 Deployed System Status (Stellar Testnet)

*   **Soroban Contract ID**: `CDG2YPKRGRESHRSCLHER5QPDSF4X67OOTIQTH6EDPX3SBIH726X4VZOX`
*   **WASM Bytecode Hash**: `22f2ba69f7039b3134b312f81a90c7d881a17dfaa5e92970d79226271396358a`
*   **Native Asset (XLM) SAC**: `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`
*   **Deployer Admin Address**: `GCDO2UGNYMUJZXNDKBG7SDZEV66QIMVBJ6HF4G57YTNWDQQROXVML24X`

You can inspect the contract activity on [Stellar Stellar.expert Testnet Explorer](https://stellar.expert/explorer/testnet/contract/CDG2YPKRGRESHRSCLHER5QPDSF4X67OOTIQTH6EDPX3SBIH726X4VZOX).

---

## ✨ Features

### 1. Wallet Integration
*   Powered by `@creit.tech/stellar-wallets-kit`.
*   Support for multiple wallets including **Freighter**, **xBull**, **Albedo**, **Lobstr**, and **Hana**.
*   Reactive connection/disconnection states, auto-refreshing XLM balances, and robust error handling for user rejections or missing extensions.

### 2. Grant Life-Cycle Management
*   **Create Grant**: Grant creators can configure a recipient address, funding target (in XLM), expiration deadline, and description.
*   **Milestone Donations**: Anyone can contribute native XLM to a specific grant. Funds are held securely in the contract.
*   **Release Funds (Claim)**: Once the funding target is reached and the milestone is approved by the admin/governor, the recipient can claim/release the accumulated funds.
*   **Donor Refunds**: If the deadline passes without the target being met, donors can claim a full refund of their contributions directly from the contract.
*   **Admin Approval**: Governed by an admin role to ensure milestone compliance before funds are released.

### 3. High-Fidelity UI & State Management
*   **Real-time Event Feed**: Polling mechanisms query the contract event logs every 5 seconds, displaying live contributions and actions.
*   **Transaction Tracker**: An interactive sidebar drawer showing the status (Pending / Success / Failed) of all transactions submitted during the session, complete with clickable explorer links.
*   **Premium Dark Mode Aesthetic**: Visual design incorporating modern typography, glassmorphism, harmonious purple/cyan/emerald accents, and smooth feedback animations.

---

## 🛠️ Technology Stack

*   **Frontend**: Next.js 15 (React 19 RC), TypeScript, Tailwind CSS
*   **Smart Contracts**: Rust, Soroban SDK
*   **Wallet SDK**: `@creit.tech/stellar-wallets-kit`
*   **Client State**: Zustand (wallet & transaction status)
*   **Server State & Polling**: React Query (polling event logs, active grant data)
*   **Client SDK**: `@stellar/stellar-sdk`

---

## 📋 Prerequisites

To compile and run this project, make sure you have the following installed:
*   [Node.js (v18.x or newer)](https://nodejs.org/)
*   [Rust (v1.81.0 toolchain is mandatory to build Soroban WASM without reference-types)](https://www.rust-lang.org/)
*   [Target `wasm32-unknown-unknown` for Cargo](https://rustwasm.github.io/)

---

## ⚙️ Environment Configuration

Copy the example file to `.env.local` and populate it:
```bash
cp .env.example .env.local
```

### `.env.local` Variables:
*   `NEXT_PUBLIC_CONTRACT_ADDRESS`: The deployed Soroban contract address.
*   `NEXT_PUBLIC_TOKEN_ADDRESS`: The Testnet native XLM SAC token address (`CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`).
*   `DEPLOYER_SECRET_KEY`: Private key used by the deploy script to fund accounts and submit contracts (e.g. `SBQQE...`).

---

## 🛠️ Local Setup & Deployment

### 1. Build the Soroban Smart Contract
Compile the Rust contract into reference-types-free WASM:
```bash
npm run contract:compile
```
*Note: This command runs Cargo with Rust `+1.81.0` and output-flags specifically configured to exclude reference-types, which is required by the Soroban Testnet validator.*

### 2. Deploy to Stellar Testnet
Deploy and initialize the contract on Testnet:
```bash
npm run contract:deploy
```
This script will:
1. Load (or generate) the deployer keypair.
2. Fund it via Friendbot.
3. Upload the contract WASM.
4. Instantiate the contract.
5. Initialize states (binding the Admin address and Native Token SAC).
6. Automatically write values to `.env.local` and `lib/contract-config.json`.

### 3. Run the Next.js Web App
Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 👛 Wallet Setup for Testing

1. Install the **Freighter** or **xBull** extension in your browser.
2. Switch the network within the wallet settings to **Testnet**.
3. Create a test account and copy its address.
4. Fund your test wallet via the [Stellar Laboratory Friendbot](https://laboratory.stellar.org/#account-creator?network=testnet) by entering your public key.
5. Connect your wallet inside the DApp.

---

## 🚢 Deployment to Vercel

1. Push your repository to GitHub.
2. Connect the repository to Vercel.
3. Configure the Environmental Variables in Vercel settings matching your local `.env.local` variables.
4. Deploy.
