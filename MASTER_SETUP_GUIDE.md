# 🎯 FitWager - Complete Local Server & Multi-User Testing Setup

## ⚡ TL;DR - Get Running in 5 Minutes

```bash
# Terminal 1: Start server
cd /home/danielg/FitWager/FitWager/FitWager/client && npm run dev

# Then in browser:
# 1. Open http://localhost:3000
# 2. Connect wallet (Phantom/Solflare/Backpack)
# 3. Get test SOL: https://faucet.solana.com/
# 4. Create challenge or join existing ones!
```

---

## 📚 Documentation Guide

### 🚀 For Getting Started
- **READ FIRST:** `COPY_PASTE_COMMANDS.md` - Just copy & paste commands!
- **THEN:** `QUICK_REFERENCE.md` - Quick cheat sheet

### 🖥️ For Local Server Setup  
- **LOCAL_SERVER_SETUP.md** - Complete setup guide
  - System requirements
  - Installation steps
  - Configuration
  - Troubleshooting

### 👥 For Multi-User Testing
- **TESTING_GUIDE.md** - Comprehensive testing scenarios
  - Multiple browser setup
  - Network testing
  - Testing workflows
  - Performance testing

### ⛓️ For Blockchain Details
- **BLOCKCHAIN_INTEGRATION.md** - Technical blockchain guide
- **QUICKSTART_BLOCKCHAIN.md** - Blockchain quick start
- **IMPLEMENTATION_SUMMARY.md** - Implementation details

---

## 🎯 Quick Start Paths

### Path 1: "Just Make It Work!" (5 min)

```
1. Read: COPY_PASTE_COMMANDS.md
2. Copy & paste commands
3. Done! Start testing
```

### Path 2: "I Want to Understand" (20 min)

```
1. Read: QUICK_REFERENCE.md
2. Read: TESTING_GUIDE.md  
3. Follow scenarios
4. Understand flow
5. Test with multiple users
```

### Path 3: "Full Setup & Deployment" (1 hour)

```
1. Read: LOCAL_SERVER_SETUP.md (complete)
2. Read: TESTING_GUIDE.md (complete)
3. Read: BLOCKCHAIN_INTEGRATION.md
4. Understand architecture
5. Deploy confidently
```

---

## 🚀 One-Minute Start

**Copy & paste this:**

```bash
cd /home/danielg/FitWager/FitWager/FitWager/client && npm run dev
```

Then open: **http://localhost:3000**

Done! You're running FitWager locally on devnet! 🎉

---

## 👥 Multi-User Testing - 3 Methods

### Method 1: Same Computer, Different Browsers (EASIEST)

```
Chrome Normal:      http://localhost:3000 + Phantom wallet
Firefox Incognito:  http://localhost:3000 + Solflare wallet  
Safari:             http://localhost:3000 + Backpack wallet
```

Each browser has separate wallet state. Works perfectly for testing!

### Method 2: Same Computer, Incognito Windows

```bash
# Chrome Incognito #1
Ctrl+Shift+N -> http://localhost:3000

# Chrome Incognito #2
Ctrl+Shift+N -> http://localhost:3000

# Each is completely isolated
```

### Method 3: Multiple Computers (Network Testing)

```bash
# Computer 1 (Server):
npm run dev

# Get local IP:
ipconfig getifaddr en0  # Mac
hostname -I             # Linux

# Computer 2 & 3 (Clients):
http://<SERVER_IP>:3000  # e.g., 192.168.1.100:3000
```

⚠️ All computers must be on same WiFi network!

---

## 💰 Getting Test SOL

### Web Faucet (Easiest)
```
1. https://faucet.solana.com/
2. Paste wallet address
3. Click "Request"
4. Get 2 SOL instantly
```

### CLI Airdrop (Recommended)
```bash
solana airdrop 2 YOUR_WALLET --url https://api.devnet.solana.com
```

### Multiple Users
```bash
# Get 3 different wallet addresses from app
# Then airdrop to each:

solana airdrop 2 WALLET_1 --url https://api.devnet.solana.com
solana airdrop 2 WALLET_2 --url https://api.devnet.solana.com  
solana airdrop 2 WALLET_3 --url https://api.devnet.solana.com
```

---

## 🔗 All Important URLs

| What | URL |
|------|-----|
| **Your App** | http://localhost:3000 |
| **Explore** | http://localhost:3000/challenges/public |
| **Create** | http://localhost:3000/challenges/create |
| **Dashboard** | http://localhost:3000/dashboard |
| **Solana Explorer** | https://explorer.solana.com/?cluster=devnet |
| **SOL Faucet** | https://faucet.solana.com/ |
| **Phantom Wallet** | https://phantom.app/ |
| **Solflare Wallet** | https://solflare.com/ |

---

## 🧪 Testing Workflow

### Day 1: Single User (30 min)
```
✓ Start server
✓ Connect wallet
✓ Get test SOL
✓ Create challenge
✓ View on Explorer
✓ Submit score
✓ End challenge
```

### Day 2: Two Users (1 hour)
```
✓ User 1 creates challenge
✓ User 2 joins challenge
✓ Both see updated pool
✓ Both submit scores
✓ Verify scores on-chain
✓ End challenge & payout
✓ Verify winner got SOL
```

### Day 3: Full Scenarios (2+ hours)
```
✓ Multiple challenges active
✓ Different stakes
✓ Different durations
✓ Search & filter
✓ Mobile responsive
✓ Wallet connect/disconnect
✓ Network errors (throttle in DevTools)
```

---

## 🎯 Testing Scenarios

### Scenario 1: Basic Create & Join
```
1. User 1: Create "Morning Run" challenge
2. User 2: See it in Explore
3. User 2: Join with 0.1 SOL
4. User 1: See User 2 joined
5. Verify on Explorer
```

### Scenario 2: Score & Payout
```
1. Both users submit scores
2. See leaderboard updated
3. End challenge (wait time or set short duration)
4. Verify winner gets 95% of pool
5. Verify platform gets 5%
```

### Scenario 3: Multiple Challenges
```
1. Create 3 different challenges
2. All visible in Explore
3. Users join different ones
4. Each has its own leaderboard
5. Can filter by type
```

---

## ⚙️ Environment Configuration

**File:** `client/.env.local`

```env
# Network
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com

# Program
NEXT_PUBLIC_PROGRAM_ID=Fg6PaFpoGXkYsidMpWxqSW1JmAxo9ZPVknpYAH97PvX1
```

**If you need faster RPC:**
```env
# Alternative: Geometry
NEXT_PUBLIC_RPC_ENDPOINT=https://devnet.geometry.io/solana
```

---

## 🛠️ Useful Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Check dependencies
npm list --depth=0

# Clear cache
rm -rf .next node_modules
npm install

# Kill port 3000 (if stuck)
kill -9 $(lsof -ti:3000)

# Check wallet balance
solana balance --url https://api.devnet.solana.com

# Get test SOL
solana airdrop 2 YOUR_WALLET --url https://api.devnet.solana.com
```

---

## ❌ Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Port 3000 in use | `kill -9 $(lsof -ti:3000)` |
| Wallet not connecting | Install wallet extension, refresh |
| No SOL in wallet | Use faucet or airdrop command |
| RPC too slow | Use alternative RPC in .env.local |
| Can't see other user's data | Refresh page (sync takes time) |
| Transaction failed | Check Explorer for error details |
| Can't access from other PC | Check WiFi connection, use local IP |

---

## 🔍 Verification Checklist

Before considering setup complete:

- [ ] `npm run dev` runs without errors
- [ ] App loads at http://localhost:3000
- [ ] Wallet connects successfully
- [ ] Get SOL appears in wallet
- [ ] Can create challenge
- [ ] Challenge appears in /challenges/public
- [ ] Can join from different browser
- [ ] Transaction appears on Solana Explorer
- [ ] On-chain state updated correctly

---

## 📊 Performance Metrics

Expected performance on local devnet:

| Action | Time |
|--------|------|
| Page load | <1s |
| Wallet connect | 1-2s |
| Create challenge | 3-5s |
| Join challenge | 3-5s |
| Submit score | 2-3s |
| End challenge | 3-5s |
| Explorer load | 1-2s |

---

## 🎓 Learning Path

### Level 1: Basic Understanding
- What is Solana devnet?
- What is a Phantom wallet?
- How do transactions work?
- **Read:** QUICKSTART_BLOCKCHAIN.md

### Level 2: Technical Details
- How does Anchor work?
- How are PDAs generated?
- What's the program flow?
- **Read:** BLOCKCHAIN_INTEGRATION.md

### Level 3: Advanced Testing
- Load testing
- Network simulation
- Edge cases
- **Read:** TESTING_GUIDE.md

---

## 🚀 Next Steps After Local Testing

Once local testing is working:

1. **Test on Testnet**
   - Deploy program to testnet
   - Update PROGRAM_ID
   - Deploy app to testnet

2. **Gather Feedback**
   - User testing
   - Bug reports
   - Feature requests

3. **Prepare for Mainnet**
   - Security audit
   - Performance optimization
   - Gas optimization

4. **Deploy to Production**
   - Update program
   - Update app
   - Launch!

---

## 📞 Support Resources

- **Solana Docs:** https://docs.solana.com/
- **Anchor Docs:** https://book.anchor-lang.com/
- **Next.js Docs:** https://nextjs.org/docs
- **Explorer:** https://explorer.solana.com/
- **Faucet:** https://faucet.solana.com/

---

## 🎯 File Organization

```
FitWager/
├── COPY_PASTE_COMMANDS.md    ← START HERE!
├── QUICK_REFERENCE.md        ← Cheat sheet
├── LOCAL_SERVER_SETUP.md     ← Full setup guide
├── TESTING_GUIDE.md          ← Testing scenarios
├── BLOCKCHAIN_INTEGRATION.md ← Technical details
├── IMPLEMENTATION_SUMMARY.md ← What changed
├── setup-local.sh            ← Setup script
├── QUICK_START.sh            ← Quick start script
└── client/
    ├── .env.local            ← Configuration
    ├── src/                  ← App source code
    ├── node_modules/         ← Dependencies
    └── package.json          ← Dependencies list
```

---

## 🎉 You're All Set!

You now have:

✅ **Local server setup** - Running on localhost:3000
✅ **Multi-user testing** - Test with 2+ users easily
✅ **Blockchain integration** - Real transactions on devnet
✅ **Full documentation** - Complete guides for everything
✅ **Quick references** - Fast lookup for commands

### **Start now:**

```bash
cd /home/danielg/FitWager/FitWager/FitWager/client
npm run dev
```

Then open: http://localhost:3000

**That's it! Start testing FitWager! 🚀**

---

**Questions? Check the relevant guide from the documentation list above.**
