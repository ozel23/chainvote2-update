# 🗳️ ChainVote — Secure Blockchain E-Voting System

A production-ready, decentralized e-voting platform built on **Ethereum** smart contracts. Every vote is an on-chain transaction — immutable, transparent, and verifiable.

---

## 📁 Project Structure

```
Blockchain/
├── blockchain/                  # Hardhat project (smart contracts)
│   ├── contracts/
│   │   └── Voting.sol           # ✅ Main SecureVoting smart contract
│   ├── scripts/
│   │   └── deploy.js            # Deployment script
│   ├── test/
│   │   └── Voting.test.js       # Comprehensive tests
│   ├── hardhat.config.js
│   ├── .env.example
│   └── package.json
├── frontend/                    # React + Vite frontend
│   ├── src/
│   │   ├── context/
│   │   │   └── Web3Context.jsx  # Web3 state (wallet, contract)
│   │   ├── hooks/
│   │   │   └── useVoting.js     # Voting data + real-time updates
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx    # MetaMask connect page
│   │   │   ├── VotingPage.jsx   # Candidate list + vote action
│   │   │   └── AdminPage.jsx    # Admin dashboard
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── CandidateCard.jsx
│   │   │   ├── NetworkWarning.jsx
│   │   │   └── LoadingScreen.jsx
│   │   ├── utils/
│   │   │   ├── VotingABI.json   # Contract ABI (auto-updated by deploy)
│   │   │   └── contractConfig.js # Contract address (auto-updated)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js** v18+ (via nvm: `nvm use 22`)
- **MetaMask** browser extension installed

### Step 1 — Install dependencies

```bash
# Smart contract dependencies
cd blockchain
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### Step 2 — Start local Hardhat blockchain node

Open a **new terminal** and keep it running:
```bash
cd blockchain
npx hardhat node
```

This starts a local Ethereum node at `http://127.0.0.1:8545` and prints 20 test accounts with private keys.

### Step 3 — Deploy the contract

In another terminal:
```bash
cd blockchain
npm run deploy:local
```

This will:
- Deploy `SecureVoting.sol` to your local node
- Seed 3 demo candidates
- Auto-write `contractConfig.js` and `VotingABI.json` to the frontend

### Step 4 — Configure MetaMask for local network

1. Open MetaMask → **Networks** → **Add Network**
2. Fill in:
   - **Network Name**: `Hardhat Local`
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency**: `ETH`
3. Import a test account: copy any private key printed by `npx hardhat node` (Account #0 is the admin)

### Step 5 — Run the frontend

```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌐 Testnet Deployment (Sepolia)

### Step 1 — Set up environment

```bash
cd blockchain
cp .env.example .env
```

Edit `.env`:
```env
PRIVATE_KEY=your_metamask_private_key_without_0x
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
ETHERSCAN_API_KEY=your_etherscan_key
```

> Get a free Alchemy API key at [alchemy.com](https://www.alchemy.com)  
> Get Sepolia test ETH from [sepoliafaucet.com](https://sepoliafaucet.com)

### Step 2 — Deploy to Sepolia

```bash
cd blockchain
npm run deploy:sepolia
```

### Step 3 — Update frontend network config

Edit `frontend/src/utils/contractConfig.js`:
```js
export const NETWORK_CHAIN_ID = 11155111; // Sepolia
```

### Step 4 — Verify on Etherscan (optional)

```bash
npx hardhat verify --network sepolia YOUR_CONTRACT_ADDRESS
```

---

## 🧪 Run Tests

```bash
cd blockchain
npm test
```

---

## 🔒 Security Architecture

### Smart Contract Security

| Threat | Mitigation |
|--------|-----------|
| Double voting | `mapping(address => bool) hasVoted` checked before every vote |
| Reentrancy attack | Custom non-reentrant mutex guard (checks-effects-interactions) |
| Unauthorized admin actions | `onlyAdmin` modifier using immutable `admin` address |
| Voting outside election period | `votingIsOpen` modifier on `vote()` |
| Invalid candidate targeting | Bounds check on candidate ID (`>0 && <=candidateCount`) |
| Empty input injection | `EmptyName` / `EmptyDescription` custom error guards |
| Admin key theft | Admin set once at constructor via `immutable` — cannot be changed |
| Timestamp manipulation | No `block.timestamp` dependency throughout contract |
| Vote deletion | No `delete` or overwrite mechanism exists in the contract |
| Contract upgrade | No proxy or upgrade pattern — contract is fully immutable |

### Frontend Security

- Wallet authentication via MetaMask — no passwords, no session tokens
- All sensitive actions require on-chain transaction signature
- Network guard prevents transactions on wrong chain
- Wallet address is your identity — no centralized database

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contract | Solidity 0.8.20 |
| Blockchain Dev | Hardhat 2.x |
| Frontend Framework | React 18 + Vite 5 |
| Web3 Library | Ethers.js v6 |
| Wallet | MetaMask |
| Styling | Vanilla CSS (glassmorphism dark theme) |
| Notifications | react-hot-toast |
| Icons | lucide-react |

---

## 📜 Smart Contract Reference

**Contract: `SecureVoting`**

| Function | Access | Description |
|----------|--------|-------------|
| `addCandidate(name, desc, imageUrl)` | Admin only | Add a new candidate |
| `openVoting()` | Admin only | Open the voting period |
| `closeVoting()` | Admin only | Close the voting period |
| `vote(candidateId)` | Any voter | Cast a vote (once, while open) |
| `getAllCandidates()` | Public | Returns all candidate data |
| `getCandidate(id)` | Public | Returns one candidate |
| `getVoterInfo(address)` | Public | Returns voted status + choice |
| `getTotalVotes()` | Public | Returns aggregate vote count |

**Events emitted:**
- `VoteCast(address voter, uint candidateId)`
- `CandidateAdded(uint id, string name)`
- `VotingStatusChanged(bool isOpen)`

---

*Built with ❤️ for secure, transparent democratic participation.*
