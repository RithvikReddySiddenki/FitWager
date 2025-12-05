# 🚀 FitWager Local Server - Quick Reference

## ⚡ 5-Minute Quick Start

```bash
# 1. Start server
cd /home/danielg/FitWager/FitWager/FitWager/client
npm run dev

# 2. Open browser
http://localhost:3000

# 3. Connect wallet (Phantom/Solflare/Backpack)

# 4. Get test SOL
# Option A - Web: https://faucet.solana.com/
# Option B - CLI: solana airdrop 2 <wallet> --url https://api.devnet.solana.com

# 5. Create challenge or join existing ones!
```

## 🔗 All URLs at a Glance

| Purpose | URL |
|---------|-----|
| **Main App** | http://localhost:3000 |
| **Explore Challenges** | http://localhost:3000/challenges/public |
| **Create Challenge** | http://localhost:3000/challenges/create |
| **Dashboard** | http://localhost:3000/dashboard |
| **View Challenge** | http://localhost:3000/challenges/[id] |
| **Solana Explorer** | https://explorer.solana.com/?cluster=devnet |
| **SOL Faucet** | https://faucet.solana.com/ |

## 👥 Testing with Multiple Users

### Same Computer - Different Browsers

```
Browser 1 (Chrome):
  - http://localhost:3000
  - Phantom wallet

Browser 2 (Firefox Incognito):
  - http://localhost:3000  
  - Solflare wallet

Browser 3 (Safari):
  - http://localhost:3000
  - Backpack wallet
```

### Multi-Computer Testing

```
Computer 1 (Server):
  npm run dev

Computer 2 (Client):
  http://<SERVER_IP>:3000
  
Computer 3 (Client):
  http://<SERVER_IP>:3000
```

Get server IP:
```bash
ipconfig getifaddr en0  # Mac
hostname -I             # Linux
```

## 📋 Testing Workflow

### Step 1: Setup (5 min)
```bash
npm run dev
✓ Server running on http://localhost:3000
```

### Step 2: Connect Wallet (1 min)
```
1. Open app
2. Click "Connect Wallet"
3. Select wallet (Phantom, Solflare, Backpack)
4. Approve connection
```

### Step 3: Get Test SOL (2 min)
```bash
# Copy wallet address from app
# Visit: https://faucet.solana.com/
# Paste address
# Request 2 SOL
# Should appear in wallet in ~30 seconds
```

### Step 4: Create Challenge (3 min)
```
1. Click "Create Challenge"
2. Fill in:
   - Name: Test Challenge
   - Type: Steps
   - Goal: 5000
   - Stake: 0.1 SOL
   - Duration: 1 Week
3. Click "Create"
4. Approve in wallet
5. Watch transaction appear on Explorer
```

### Step 5: Open Second User (2 min)
```
1. Open new browser window (Firefox Incognito)
2. Go to http://localhost:3000
3. Connect different wallet (Solflare)
4. Get 2 SOL
```

### Step 6: Join Challenge (2 min)
```
1. Click "Explore"
2. Find "Test Challenge" from User 1
3. Click "Join for ◎0.1"
4. Approve transaction
```

### Step 7: Verify on Blockchain (1 min)
```
1. Copy transaction signature from toast
2. Visit: https://explorer.solana.com/?cluster=devnet
3. Search signature
4. See all on-chain details
```

## 🛠️ Common Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm run test

# Check dependencies
npm list

# Clear cache
rm -rf .next node_modules
npm install

# Check if port is in use
lsof -i :3000

# Kill process on port 3000
kill -9 $(lsof -ti:3000)
```

## 💾 Getting Test SOL

### Option A: Web Faucet (Easiest)
```
1. https://faucet.solana.com/
2. Paste wallet address
3. Click "Request"
4. Get 2 SOL instantly
```

### Option B: CLI Airdrop (Recommended)
```bash
solana airdrop 2 YOUR_WALLET_ADDRESS --url https://api.devnet.solana.com
```

### Option C: Multiple Wallets
```bash
# User 1
solana airdrop 2 USER1_WALLET --url https://api.devnet.solana.com

# User 2
solana airdrop 2 USER2_WALLET --url https://api.devnet.solana.com

# User 3
solana airdrop 2 USER3_WALLET --url https://api.devnet.solana.com
```

## 🎯 Transaction Verification

1. **Copy signature** from app toast
2. **Visit Explorer:** https://explorer.solana.com/?cluster=devnet
3. **Search** the signature
4. **See details:**
   - Status: Success/Failed
   - Program: FitWager
   - Accounts: Challenge, Vault, Creator, System Program
   - Logs: Program execution logs
   - SOL transferred

## ❌ Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 3000 in use | `kill -9 $(lsof -ti:3000)` |
| Wallet not connecting | Install extension, refresh, try again |
| No SOL in wallet | Use faucet or airdrop command |
| RPC timeout | Use alternative endpoint in .env.local |
| Can't see challenge | Refresh page (data takes time to sync) |
| Transaction failed | Check Explorer for error logs |
| Can't access from other computer | Check they're on same WiFi, use local IP |

## 🔧 Environment Config

**File:** `client/.env.local`

```env
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=Fg6PaFpoGXkYsidMpWxqSW1JmAxo9ZPVknpYAH97PvX1
```

Alternative RPC (if slow):
```env
# Geometry
NEXT_PUBLIC_RPC_ENDPOINT=https://devnet.geometry.io/solana
```

## 📊 Testing Checklist

- [ ] Server starts: `npm run dev`
- [ ] App loads: http://localhost:3000
- [ ] Wallet connects
- [ ] Get test SOL
- [ ] Create challenge
- [ ] Challenge appears in explore
- [ ] Second user joins
- [ ] Score submission works
- [ ] End challenge
- [ ] Winner gets paid
- [ ] Loser gets refund (if applicable)
- [ ] Check all on Explorer

## 📈 Performance Tips

```bash
# Fast development reload
npm run dev

# Production-like testing
npm run build && npm start

# Monitor while testing
npm run dev 2>&1 | tee dev.log
```

## 🌐 Network Modes

### Local Only (Single Computer)
```
http://localhost:3000
```

### Local Network (Multiple Computers)
```
http://<SERVER_IP>:3000
```

Get IP:
```bash
ipconfig getifaddr en0  # Mac
hostname -I             # Linux
```

## 🔐 Wallet Setup

### Phantom (Recommended)
```
1. https://phantom.app/
2. Create wallet
3. Switch to Devnet
4. Use in browser
```

### Solflare (Alternative)
```
1. https://solflare.com/
2. Create wallet
3. Network: Devnet
4. Use in different browser
```

### Backpack (Alternative)
```
1. https://www.backpack.app/
2. Create wallet
3. Network: Devnet
4. Use in different browser
```

## 📚 Full Guides

For detailed information:
- **Setup:** `LOCAL_SERVER_SETUP.md`
- **Testing:** `TESTING_GUIDE.md`
- **Integration:** `BLOCKCHAIN_INTEGRATION.md`
- **Implementation:** `IMPLEMENTATION_SUMMARY.md`

## 🚀 One-Liner Start

```bash
cd /home/danielg/FitWager/FitWager/FitWager/client && npm run dev
```

Then open: http://localhost:3000

---

**Ready to test? Just run `npm run dev` in the client directory! 🎉**

