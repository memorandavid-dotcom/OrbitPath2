# OrbitPath — Full-Stack Consumer Wallet Gateway

OrbitPath acts as an intelligent routing layer and secure cross-border remittance gateway built on the **Stellar Network** and **Soroban Smart Contracts**. It is designed to look, feel, and operate like a modern consumer fintech wallet (similar to GCash, Maya, or GoTyme).

By programmatically scanning multi-asset liquidity paths and automating swap settlements, OrbitPath eliminates standard correspondent banking intermediary markups and provides migrant workers with guaranteed real-time payout delivery to mobile money and local bank targets (SEP-31).

---

## 🚀 Key Functional Architecture

```
[Onboarding Sign Up] ──► [Generates On-Chain Cryptographic Keypair]
        │
        ▼
[Secure Sign In (MPIN)] ──► [Initiates Active Session Token]
        │
        ▼
[User Applet] (Single-View Responsive Layout / Mobile Bottom Nav)
        │
        ▼ (Initiates Send with Session-Isolated Profile)
[Express Proxy /api/execute-transfer] (Reads User Session)
        │
        ▼ (Observer Relayer Script Logs Books)
[Horizon testnet.strictReceivePaths] ────► [DEX & AMM Liquidity Pools]
        │
        ▼ (Soroban Smart Contract)
[Soroban Trustless Slippage Check]
        │
        ▼ (Stellar Multi-Asset Atomic Swap)
[PathPaymentStrictReceive Operation]
        │
        ▼ (Settlement Outflow)
[SEP-31 Local Fiat Anchor Payout] ────► [Recipient Bank / GCash Payout]
```

---

## 🛠️ Onboarding, Security, & Architecture Features

### 1. Dedicated Authentication Flow (Sign Up / Sign In / Log Out)
* **Welcome Screen:** Beautiful onboarding portal supporting toggling between Login and Registration.
* **On-Chain Keypair Initialization:** Registration instantly spawns a randomized Stellar keypair (public & private key) on the server, establishing a secure on-chain wallet behind the scenes.
* **6-Digit MPIN Security:** Returning users can access their balance securely via a 6-digit passcode.
* **Terms of Service Compliance:** Before finalizing account creation, users must review and explicitly agree to the digital wallet agreement (`TERMS_OF_SERVICE.md`).

### 2. Strict Account Isolation & Data Privacy
* **Privacy Rule:** Under no circumstances should internal database User IDs, raw Stellar Public Keys, or Soroban Contract IDs be exposed anywhere in the user-facing interface.
* **Secured Backend:** All keys remain strictly contained within the backend server database. The client-side is given only session tokens and represented using masked placeholder indicators (e.g., `OrbitPath User ****ICE2` or `Account Connected`).

### 3. Absolute Visual Theme (Midnight Slate)
* **Visual Consolidation:** The interface enforces a professional **Midnight Slate Theme**. All high-contrast indigo, sapphire, and emerald layouts have been replaced with a deep, low-fatigue slate-950 canvas.
* **System-Wide Palette:** Components utilize solid slate-900 dark frames with subtle cool-grey/slate-850 borders and soft slate-400 text highlights, offering a high-contrast but visual-noise-free experience.

### 4. Consolidated QR Scanner Gateways & In-App Permissions
* **In-App Permission Dialog:** Users are prompted with a secure, simulated in-app browser dialog prior to video stream request.
* **Granular Permission Choice:** Users can select:
  * *Only This Time:* Grants camera stream permissions temporarily. Resets to undecided upon modal close so the system asks again next time.
  * *Always Allow:* Stores preference permanently inside `localStorage` for automatic instant access during future scanner loads.
  * *Ask Again Later:* Postpones the permission request and closes the modal view cleanly.
  * *Don't Ask Again:* Blocks camera stream initiation permanently and redirects focus immediately to high-utility manual text entry inputs or local QR upload fallbacks.
* **Flexible Reset Options:** If blocked permanently, an elegant **Reset Permissions** button is displayed inside the viewfinder error wrapper to clear state flags and re-trigger choices effortlessly.
* **QR Camera Viewfinder:** Interactive scanner modal parses Stellar pay URIs (`stellar:pay?amount=...`) with reactive laser sweep animation.
* **Local Image Fallback:** To maximize accessibility, a native file uploader sits directly beneath the viewfinder, allowing users to import saved GCash/Maya QR images directly from their device storage.
* **Zero Header Clutter:** Redundant top-bar "Scan QR" triggers have been completely purged, maintaining the focus entirely on the persistent bottom navigation flow.

### 5. Interactive Dual-Purpose Avatar Portal
* **Master Side Drawer:** Clicking the User Avatar inside the header slides open the secure core profile panel.
* **Secure Panel Actions:** Contains authorized personal profile masks, self-managed saved payout QR configurations (supporting dynamically adding/deleting profiles), clickable access to the **Digital Wallet Agreement**, and an operational **Sign Out Securely** module that instantly terminates the session token.

### 6. End-to-End Session Security Countdown
* **Secure Countdown Indicator:** Serves real-time visibility into the current 15-minute secure session token window with precise countdowns and dynamic status feedback.

### 7. Stateful Offline-First & Resilient Vercel Architecture
* **Direct Local Storage Initialization:** Main React states (`savedQRs`, `uploadedQR`, `notifications`, and `history`/`transactionHistory`) initialize directly from the client browser's `window.localStorage` inside custom state-initialization functions, completely guarded with SSR compatibility checks (`typeof window !== 'undefined'`) to prevent Vercel build-time errors.
* **Automated Serialization Listeners:** Targeted reactive `useEffect` hooks automatically serialize, synchronize, and commit state updates to browser storage as soon as any change occurs.
* **Smart Back-Sync Re-Synchronization:** Since Vercel serverless containers are stateless and destroy backend in-memory user-specific arrays upon container teardowns, the frontend's fetching system is reinforced with a back-sync mechanism: on mount, if the serverless backend has restarted (returning empty profiles), OrbitPath automatically uploads and restores the client's cached billing profiles and connected payout targets back into the server memory.
* **Hardcoded Fallback Constants:** Immutable default fallback configurations, preseeded developer profiles, and baseline simulation configurations are hardcoded securely in-code as arrays to serve as instant structural skeletons.

---

## 💻 Tech Stack & Setup

* **Frontend**: React (v18) + Vite + Tailwind CSS (v4) + Motion
* **Backend**: Node.js + Express (Session Manager & Proxy to Horizon Testnet API)
* **SDKs**: `@google/genai` (Server-side model generation), `stellar-sdk` (DEX and Horizon connectivity)
* **Licensing**: Open Source Remittance Architecture

---

## 🤝 Getting Started

1. Set your `STELLAR_PRIVATE_KEY` inside `.env` to sign actual transactions on testnet.
2. Run development servers with:
   ```bash
   npm run dev
   ```
3. Open the app on `http://localhost:3000` to register, log in, and simulate dynamic QR payments!

---

## 📞 Contact Address & Support

For questions, technical inquiries, or security auditing, please reach out to the project administrator:

* **Email:** [davidhyzxentm@gmail.com](mailto:davidhyzxentm@gmail.com)
* **Mobile Number:** `09912657389`
