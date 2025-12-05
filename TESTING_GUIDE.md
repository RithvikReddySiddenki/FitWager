# FitWager Local Devnet Testing Guide

## Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn
- Solana CLI (optional, for managing test wallets)
- Multiple browser windows or browser profiles

### Setup

```bash
# 1. Navigate to the project directory
cd /home/danielg/FitWager/FitWager/FitWager

# 2. Run setup script
bash setup-local.sh

# OR manually:
cd client
npm install
```

### Configuration

Verify `.env.local` exists in the client directory:

```env
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=Fg6PaFpoGXkYsidMpWxqSW1JmAxo9ZPVknpYAH97PvX1
```

### Start Local Server

```bash
cd /home/danielg/FitWager/FitWager/FitWager/client
npm run dev
```

The app will be running at: **http://localhost:3000**

## Testing with Multiple Users

### Option 1: Browser Incognito Windows (Easiest)

```
1. Open http://localhost:3000 in Firefox (User 1)
2. Open http://localhost:3000 in Chrome Incognito (User 2)
3. Open http://localhost:3000 in Safari (User 3)
4. Each has its own wallet state
```

**Advantages:**
- ✅ No wallet conflict
- ✅ Independent wallet connections
- ✅ Each browser is isolated
- ✅ Perfect for testing

**How to do it:**
```
Chrome:    Ctrl+Shift+N (Windows) / Cmd+Shift+N (Mac)
Firefox:   Ctrl+Shift+P (Windows) / Cmd+Shift+P (Mac)
Safari:    Cmd+Shift+N (Mac)
Edge:      Ctrl+Shift+InPrivate (Windows)
```

### Option 2: Different Browser Profiles

Each browser has profile functionality:

**Chrome:**
1. Click profile icon (top right)
2. Click "Add" to create new profile
3. Each profile is a separate browser instance
4. Can run multiple profiles simultaneously

**Firefox:**
1. Open `about:profiles` in address bar
2. Click "Create a New Profile"
3. Launch each profile in new window

**Edge:**
1. Settings → Profiles
2. Add new profile
3. Each profile is isolated

### Option 3: Browser Extensions (Power User)

Install wallet extensions for each account:
- **Phantom Wallet** - Multiple accounts within one extension
  - Click wallet → Create new account
  - Switch between accounts
- **Solflare** - Supports account switching
- **Backpack** - Multiple accounts per wallet

### Option 4: Network Testing (Advanced)

Test on actual network with other machines:

```bash
# Get your local machine IP
ipconfig getifaddr en0  # Mac
hostname -I             # Linux
ipconfig                # Windows

# Let's say it's 192.168.1.100

# On your machine:
npm run dev

# On other machines, visit:
http://192.168.1.100:3000
```

⚠️ **Important:** Both machines must be on same network (WiFi)

## Getting Test SOL

### Option 1: Solana CLI (Recommended)

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.9/install)"

# Get your wallet address from the app
# Or create one with CLI:
solana-keygen new

# Get test SOL
solana airdrop 2 <WALLET_ADDRESS> --url https://api.devnet.solana.com

# Verify balance
solana balance --url https://api.devnet.solana.com
```

### Option 2: Faucet Website

1. Visit: https://faucet.solana.com/
2. Paste your wallet address
3. Click "Request SOL"
4. Get 2 SOL per request
5. Can request every 24 hours

### Option 3: In-App (Future Feature)

FitWager can integrate a built-in faucet for testing.

## Multi-User Testing Scenarios

### Scenario 1: Create and Join

**User 1 (Creator):**
1. Connect Phantom wallet
2. Get 2 SOL airdrop
3. Click "Create Challenge"
4. Fill in:
   - Name: "Morning Jog"
   - Type: Distance
   - Goal: 5
   - Stake: 0.1 SOL
   - Duration: 1 Week
5. Click "Create"
6. Approve transaction in wallet

**User 2 (Participant):**
1. Open new incognito window
2. Connect different wallet (Solflare)
3. Get 2 SOL airdrop
4. Click "Explore" → "Challenges"
5. See "Morning Jog" from User 1
6. Click "Join for ◎0.1"
7. Approve transaction

**What happens:**
- ✅ User 1's SOL locked in escrow
- ✅ User 2's SOL locked in escrow
- ✅ Pool grows to 0.2 SOL
- ✅ Both appear on challenge page

### Scenario 2: Submit Scores

**User 1:**
1. On challenge page
2. Submit score: 5.2 km
3. Approve transaction
4. Score recorded on-chain

**User 2:**
1. Submit score: 4.8 km
2. Approve transaction
3. Score recorded on-chain

**Verification:**
- Check on Solana Explorer
- Both scores visible on challenge page
- Leaderboard updated

### Scenario 3: Challenge Ends & Payout

**User 1 (Creator):**
1. Wait for challenge duration to end (or set short duration for testing)
2. Click "End Challenge"
3. Select winner (e.g., User 1 - 5.2 km)
4. Approve payout transaction

**What happens:**
- ✅ Winner gets 95% of pool: 0.19 SOL
- ✅ Platform gets 5%: 0.01 SOL
- ✅ Funds appear in winner's wallet
- ✅ Challenge marked as ended

## Testing Commands

### Check Transaction on Explorer

```bash
# Copy signature from toast notification in app
# Visit:
https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet

# Should show:
- Transaction status: Success
- Program: FitWager Program ID
- Accounts modified
- Logs from program execution
```

### Verify On-Chain State

```bash
# Using Solana CLI
solana account <CHALLENGE_PDA> --url https://api.devnet.solana.com

# Example:
solana account Fcdaf4yPLAYa2YEdmU3E54T2xAP2L3kWaCNXxqhDRSQs --url https://api.devnet.solana.com
```

### Monitor Local Logs

```bash
# Terminal 1: Run dev server
npm run dev

# Terminal 2: Watch for changes
npm run build -- --watch
```

## Troubleshooting

### "Wallet not connected"
**Solution:** 
- Install Phantom/Solflare in browser
- Refresh page
- Click "Connect Wallet"

### "Insufficient funds"
**Solution:**
- Get more test SOL
- `solana airdrop 5 <wallet> --url https://api.devnet.solana.com`
- If airdrop fails, use https://faucet.solana.com/

### "Account not found"
**Solution:**
- Wait a few seconds for transaction to confirm
- Refresh page
- Check on Explorer if transaction succeeded

### "Network timeout"
**Solution:**
- RPC might be overloaded
- Try different RPC: https://devnet.geometry.io/solana (free alternative)
- Update `.env.local` with new RPC
- Restart server

### Different users see different data
**Solution:**
- This is normal! Off-chain data might take time to sync
- Refresh page to see latest
- Check on-chain state on Explorer
- Blockchain is source of truth

### Can't connect to localhost:3000 from another machine
**Solution:**
- Make sure both machines on same WiFi network
- Get local IP: `ipconfig getifaddr en0` (Mac)
- Check firewall isn't blocking port 3000
- Try: `http://<LOCAL_IP>:3000:3000`

## Performance Testing

### Load Testing (Multiple Concurrent Users)

```bash
# Install Apache Bench
# Mac: brew install httpd
# Linux: apt-get install apache2-utils
# Windows: Use WSL or alternative

# Test static page load
ab -n 100 -c 10 http://localhost:3000/challenges/public

# Expected: <500ms response time
```

### Network Simulation

For slower connections:
1. Open DevTools (F12)
2. Network tab
3. Select throttling (e.g., "Slow 3G")
4. Test transaction flow

## Best Practices

### Testing Checklist

- [ ] Create challenge → appears in list
- [ ] Join challenge → SOL transfers to vault
- [ ] Submit score → recorded on-chain
- [ ] End challenge → payout works
- [ ] Multiple users → don't see each other's private data
- [ ] Search works → filter by title/creator
- [ ] Transactions appear on Explorer
- [ ] Wallet connects/disconnects properly
- [ ] Error messages are clear
- [ ] UI is responsive on mobile

### Browser DevTools Tips

**Console:**
```javascript
// Check localStorage
localStorage.getItem('fitwager-store')

// Check wallet connection
console.log(window.solana)

// Monitor RPC calls
// Network tab → XHR → Filter for api calls
```

**Network Tab:**
- Monitor API calls to `/api/challenges/*`
- Check transaction signatures
- Verify RPC responses

**Application Tab:**
- View LocalStorage state
- Check Service Worker status
- Inspect IndexedDB if using offline support

## Advanced Testing

### Unit Tests

```bash
npm run test
```

### Build Production Bundle

```bash
npm run build
npm start
```

This runs the production-optimized version locally.

### Docker (Optional)

Create a Dockerfile for containerized deployment:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV NEXT_PUBLIC_SOLANA_CLUSTER=devnet
ENV NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
ENV NEXT_PUBLIC_PROGRAM_ID=Fg6PaFpoGXkYsidMpWxqSW1JmAxo9ZPVknpYAH97PvX1

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Run with Docker:
```bash
docker build -t fitwager .
docker run -p 3000:3000 fitwager
```

## Testing Workflow

### Day 1: Single User
```
1. npm run dev
2. Connect wallet
3. Get test SOL
4. Create challenge
5. Submit score
6. End challenge
7. Verify on Explorer
```

### Day 2: Two Users
```
1. npm run dev
2. Open 2 browser windows
3. Both connect wallets
4. User 1 creates challenge
5. User 2 joins
6. Both submit scores
7. User 1 ends and pays winner
8. Verify both got correct SOL
```

### Day 3: Multiple Scenarios
```
1. Multiple challenges active
2. Different challenge types
3. Various stakes (0.02, 0.1, 0.5, 1.0)
4. Different durations
5. Test all search/filter options
6. Test mobile responsiveness
```

### Day 4: Edge Cases
```
1. Max participants joining
2. Tie scores (if applicable)
3. Out of order transactions
4. Network failures (throttle in DevTools)
5. Wallet disconnection/reconnection
6. Challenge ending before all join
```

## Monitoring & Debugging

### Enable Debug Logging

In browser console:
```javascript
localStorage.debug = 'fitwager:*'
```

### Check RPC Health

```bash
# Terminal
curl https://api.devnet.solana.com/health

# Should return: ok
```

### Monitor Account Activity

```bash
# Terminal
solana account-info <ACCOUNT_ADDRESS> --url https://api.devnet.solana.com --output json | jq
```

## Next Steps After Local Testing

1. ✅ Local testing on localhost works
2. ✅ Multiple users can join
3. ✅ Transactions appear on Explorer
4. ✅ Payouts work correctly

Then:
- [ ] Deploy to testnet
- [ ] Set up CI/CD pipeline
- [ ] Create integration tests
- [ ] Prepare for mainnet security audit
- [ ] Launch beta

## Resources

- **Solana Devnet Faucet:** https://faucet.solana.com/
- **Solana Explorer:** https://explorer.solana.com/?cluster=devnet
- **Phantom Wallet:** https://phantom.app/
- **Next.js DevTools:** https://nextjs.org/learn-pages/basics/getting-started/setup
- **Local Testing Guide:** https://nextjs.org/docs/testing

---

**Happy Testing! 🚀**

For issues or questions, check the logs and Solana Explorer for transaction details.
