# OrbitPath — Non-Custodial Digital Wallet Agreement

**Last Updated:** July 2026

Welcome to OrbitPath. Please review these Terms of Service ("Terms") carefully. By utilizing the OrbitPath application, backend APIs, or smart contract routing layers (collectively, the "Service"), you agree to be bound by these Terms.

---

## 1. Onboarding & Account Security
OrbitPath utilizes a secure, server-side non-custodial onboarding flow designed to bridge consumer convenience with cryptographic security:
* **Behind-the-Scenes Wallet Generation:** Upon successful registration (requiring a unique Username, Email, and 6-digit MPIN), OrbitPath automatically initializes a cryptographic Stellar Testnet account (keypair) inside the secure backend.
* **Passcode & Credentials Security:** You are solely responsible for memorizing and protecting your 6-digit MPIN and password. Under no circumstances should you share your MPIN. OrbitPath developers and server operators do not have access to plain-text credentials and cannot recover your account or keys if you forget your access credentials.
* **Strict Session Isolation:** All session authentication tokens are handled server-side. Raw Stellar Secret Keys and Public Keys are never stored in your browser's persistent cache or exposed on the client-side user interface.

---

## 2. On-Chain Fee Calculations & Gas
All transfers dispatched on OrbitPath interact directly with the Stellar Testnet ledger and decentralized liquidity pools. The fees are calculated dynamically on-chain:
* **Base Gas Fee:** Every transaction requires a standard Stellar network fee (measured in stroops, e.g., 100 to 150 stroops per operation). This fee is consumed by the network validator nodes and is entirely non-refundable.
* **Path-Payment Exchange Spread:** Since cross-border remittance involves swaps (e.g., converting USD stablecoin `USDC` into local payout assets like `PHP` or `NGN`), intermediate conversion rates depend on active decentralized exchange (DEX) order books and automated market maker (AMM) liquidity pools. The routing algorithm automatically scans and selects the cheapest route to minimize intermediate spreads.
* **Slippage Tolerances:** Due to the real-time volatility of liquidity pools, prices may shift between transaction creation and block inclusion. By clicking "Confirm Transfer", you agree to the default **0.5% - 5.0% slippage threshold** enforced trustlessly by the Soroban smart contracts. If the slippage exceeds this boundary, the transaction will automatically abort on-chain to save your capital.

---

## 3. Non-Custodial Protocol Risk
OrbitPath is a non-custodial software application. At no point does OrbitPath, its developers, or its server-side infrastructure act as a custodian of your digital assets or fiat currencies:
* All transactions are initiated, signed, and authorized directly by the user or through delegated session structures.
* You maintain absolute and exclusive control of your cryptographic keys, wallet credentials, and payout settings.
* Any loss of assets resulting from unauthorized access to your account, network hacks, or loss of keys is your sole responsibility.

---

## 4. No Warranties & Limitation of Liability
THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED:
* OrbitPath does not warrant that the Service will operate continuously or error-free.
* You recognize that network congestion, testnet resets, or partner fiat anchor service outages can result in transaction delays.
* In no event shall OrbitPath, its authors, or contributors be liable for any direct, indirect, incidental, or consequential damages arising from the use of, or inability to use, the platform.

---

## 5. Compliance & Local Regulatory Obligations
Users must comply with all local money-transmission, anti-money laundering (AML), and know-your-customer (KYC) regulations governing their country of residence. OrbitPath simply routes ledger instructions and does not handle fiat dispersion directly. Registered partner anchors (SEP-31) are solely responsible for fiat settlement compliance.
