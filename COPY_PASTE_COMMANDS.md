# Copy & Paste Commands - FitWager Local Testing

Just copy and paste these commands directly!

## 🟢 STEP 1: Start the Server

```bash
cd /home/danielg/FitWager/FitWager/FitWager/client
npm run dev
```

**Expected output:**
```
> client@0.1.0 dev
> next dev

  ▲ Next.js 16.0.6 (Turbopack)

  > Local:        http://localhost:3000
  > Environments: .env.local

  ✓ Ready in 2.5s
```

👉 Leave this terminal running! Open a new terminal for next steps.

---

## 🔵 STEP 2: Get Your Wallet Address

### Option A: From App (Easiest)
1. Open: http://localhost:3000
2. Click "Connect Wallet"
3. Copy the wallet address shown

### Option B: From Wallet Extension
1. Open Phantom/Solflare/Backpack
2. Copy your wallet address

---

## 🟣 STEP 3: Get Test SOL (Copy wallet address first!)

### Option A: Web Faucet (Easiest)

```bash
# 1. Copy this exact URL and open in browser:
https://faucet.solana.com/

# 2. Paste your wallet address
# 3. Click "Request"
# 4. Get 2 SOL instantly
```

### Option B: CLI Airdrop (Faster)

```bash
# Replace YOUR_WALLET with your actual wallet address!
solana airdrop 2 YOUR_WALLET --url https://api.devnet.solana.com
```

**Example:**
```bash
solana airdrop 2 7Z5PWejncC2C7NZykKFJEBWtNu2eQMyYH8TvYvFLBnUj --url https://api.devnet.solana.com
```

**Check balance:**
```bash
solana balance --url https://api.devnet.solana.com
```

Expected: `2.00000000 SOL`

---

## 🟡 STEP 4: Open App & Connect Wallet

1. Open browser: http://localhost:3000
2. Click blue "Connect Wallet" button
3. Select wallet (Phantom, Solflare, or Backpack)
4. Approve connection
5. See wallet address in top right

---

## 🟠 STEP 5: Create First Challenge

1. Click "Create Challenge" button
2. Fill in:
   ```
   Name: My First Challenge
   Type: Steps
   Goal: 5000
   Stake: 0.1 SOL
   Duration: 1 Week
   ```
3. Click "Create"
4. Approve in wallet

✅ Challenge created!

---

## 🔴 STEP 6: Test with Second User (New Browser)

### New Browser Window (Firefox):

**Terminal commands:**
```bash
# Get second wallet address from app
# Then run airdrop:
solana airdrop 2 SECOND_WALLET_ADDRESS --url https://api.devnet.solana.com
```

**Browser steps:**
1. Open Firefox Incognito: Ctrl+Shift+P
2. Go to: http://localhost:3000
3. Click "Connect Wallet"
4. Select different wallet (Solflare)
5. Approve connection

---

## 💚 STEP 7: Second User Joins Challenge

1. In Firefox (User 2), click "Explore"
2. Find "My First Challenge" created by User 1
3. Click "Join for ◎0.1"
4. Approve transaction in wallet

✅ Second user joined!

---

## 🔵 STEP 8: Verify on Solana Explorer

1. Get transaction signature:
   - Look for "success" toast in app
   - Copy signature
2. Go to: https://explorer.solana.com/?cluster=devnet
3. Paste signature in search box
4. See:
   - Transaction status
   - Program execution
   - Accounts involved
   - SOL transferred

---

## 📝 STEP 9: Submit Scores (Optional)

**User 1:**
```
1. Click challenge
2. Click "Submit Score"
3. Enter: 5200
4. Approve
```

**User 2:**
```
1. Click challenge
2. Click "Submit Score"
3. Enter: 4800
4. Approve
```

---

## 🏆 STEP 10: End Challenge & Payout (Optional)

**User 1 (Creator):**
```
1. Click challenge
2. Click "End Challenge"
3. Confirm winner
4. Approve payout transaction

Result:
- Winner gets: 0.19 SOL (95%)
- Platform gets: 0.01 SOL (5%)
```

---

## 🔧 Troubleshooting Commands

### Port Already in Use?
```bash
# Kill process using port 3000
kill -9 $(lsof -ti:3000)

# Then start again
npm run dev
```

### Clear Node Modules (If Issues)
```bash
cd /home/danielg/FitWager/FitWager/FitWager/client
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Check RPC Health
```bash
curl https://api.devnet.solana.com/health
# Should return: ok
```

### Check Specific Wallet Balance
```bash
# Replace with actual wallet address
solana balance YOUR_WALLET --url https://api.devnet.solana.com
```

---

## 🌐 Multi-Computer Testing

### On Server Machine:
```bash
npm run dev
```

### Get Server IP:
```bash
# Mac
ipconfig getifaddr en0

# Linux
hostname -I | awk '{print $1}'

# Windows
ipconfig | grep "IPv4"
```

### On Client Machines:
```
Replace localhost with server IP:
http://192.168.1.100:3000  # (use your actual IP)
```

---

## 📊 Full Testing Scenario (Copy All)

```bash
# Terminal 1: Start Server
cd /home/danielg/FitWager/FitWager/FitWager/client
npm run dev

# (Leave running, open new terminal)

# Terminal 2: Get User 1 SOL
# First, get wallet from app, then:
solana airdrop 2 USER1_WALLET --url https://api.devnet.solana.com

# Terminal 2: Get User 2 SOL
solana airdrop 2 USER2_WALLET --url https://api.devnet.solana.com

# Browser 1: Create challenge
# - Open http://localhost:3000
# - Connect User 1 wallet
# - Click "Create Challenge"
# - Fill in details
# - Submit

# Browser 2: Join challenge  
# - Open Firefox Incognito: http://localhost:3000
# - Connect User 2 wallet
# - Click "Explore"
# - Find challenge
# - Click "Join"

# Verify on Explorer
# - Copy signature
# - Visit https://explorer.solana.com/?cluster=devnet
# - Search signature
```

---

## 🎯 Quick Check List

- [ ] `npm run dev` running in terminal
- [ ] http://localhost:3000 opens in browser
- [ ] Wallet connects successfully
- [ ] Have 2+ SOL in wallet
- [ ] Can create challenge
- [ ] Challenge appears in Explore
- [ ] Can join challenge from another user
- [ ] See transaction on Explorer
- [ ] Pool grows as users join

---

## 🚀 You're Ready!

Just follow the steps above in order. Each step takes ~1-2 minutes.

**Total time:** ~15 minutes to see full working system with 2 users!

---

## 📞 Quick Help

**Can't connect wallet?**
- Install Phantom: https://phantom.app/
- Refresh page
- Click "Connect" again

**No SOL showing up?**
- Wait 30 seconds
- Check with: `solana balance YOUR_WALLET --url https://api.devnet.solana.com`
- Request more from https://faucet.solana.com/

**Transaction failed?**
- Check Explorer: https://explorer.solana.com/?cluster=devnet
- See error details
- Check RPC health: `curl https://api.devnet.solana.com/health`

**Server won't start?**
- Kill port 3000: `kill -9 $(lsof -ti:3000)`
- Clear cache: `rm -rf .next`
- Try again: `npm run dev`

---

**Everything working? You're all set! Start testing! 🎉**
