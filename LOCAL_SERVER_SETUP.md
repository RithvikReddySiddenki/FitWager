# FitWager Local Server Setup - Complete Guide

## System Requirements

- **Node.js:** 18.x or higher
- **npm:** 9.x or higher
- **RAM:** 4GB minimum
- **Disk Space:** 2GB (for node_modules)
- **Network:** Internet connection for devnet RPC
- **Browsers:** 
  - Chrome
  - Firefox
  - Safari
  - Or any modern browser with wallet extension support

## Installation Steps

### 1. Verify Prerequisites

```bash
# Check Node.js version
node --version
# Should show v18.x or higher

# Check npm version
npm --version
# Should show 9.x or higher

# Check git
git --version
```

If any are missing, install from:
- **Node.js:** https://nodejs.org/
- **Git:** https://git-scm.com/

### 2. Navigate to Project

```bash
cd /home/danielg/FitWager/FitWager/FitWager
```

### 3. Install Dependencies

```bash
cd client
npm install
```

This installs:
- Next.js 16
- React 19
- Solana Web3.js
- Anchor Framework
- Wallet adapters
- UI components
- And 200+ other dependencies

⏱️ First run: ~3-5 minutes
Subsequent runs: ~1 minute (cached)

### 4. Verify Installation

```bash
npm list --depth=0 | grep -E "@coral-xyz/anchor|@solana/web3.js|next|react"
```

Should show:
```
├── @coral-xyz/anchor@0.32.1
├── @solana/web3.js@1.98.4
├── next@16.0.6
├── react@19.2.0
└── react-dom@19.2.0
```

## Configuration

### Environment Variables

**File:** `/home/danielg/FitWager/FitWager/FitWager/client/.env.local`

Should contain:
```env
# Solana Network Configuration
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com

# Program Configuration
NEXT_PUBLIC_PROGRAM_ID=Fg6PaFpoGXkYsidMpWxqSW1JmAxo9ZPVknpYAH97PvX1

# Optional
NEXT_PUBLIC_GOOGLE_FIT_CLIENT_ID=
NEXT_PUBLIC_CIRCLE_API_KEY=
```

**If file doesn't exist, create it:**

```bash
cat > /home/danielg/FitWager/FitWager/FitWager/client/.env.local << 'EOF'
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=Fg6PaFpoGXkYsidMpWxqSW1JmAxo9ZPVknpYAH97PvX1
EOF
```

### Alternative RPC Endpoints (if main one is slow)

```env
# Geometry (free alternative)
NEXT_PUBLIC_RPC_ENDPOINT=https://devnet.geometry.io/solana

# Triton (paid, but faster)
NEXT_PUBLIC_RPC_ENDPOINT=https://triton.geometry.io/solana

# Helius (requires API key)
NEXT_PUBLIC_RPC_ENDPOINT=https://devnet.helius-rpc.com/?api-key=YOUR_KEY
```

## Starting the Server

### Development Mode (Recommended)

```bash
cd /home/danielg/FitWager/FitWager/FitWager/client
npm run dev
```

Expected output:
```
▲ Next.js 16.0.6

> Local:        http://localhost:3000
> Environments: .env.local

✓ Ready in 2.5s
```

Server is running on: **http://localhost:3000**

### Production Mode

```bash
npm run build
npm start
```

Builds optimized bundle then starts server.

## Wallet Setup for Testing

### Option 1: Phantom (Easiest)

1. Install: https://phantom.app/
2. Create new wallet or import existing
3. Switch to Devnet in settings
4. Use in browser

### Option 2: Solflare

1. Install: https://solflare.com/
2. Create wallet
3. Switch to Devnet
4. Use in different browser window

### Option 3: Backpack

1. Install: https://www.backpack.app/
2. Create wallet
3. Network: Devnet
4. Use in different browser

## Getting Test SOL

### Method 1: CLI Airdrop (Recommended)

Install Solana CLI:
```bash
sh -c "$(curl -sSfL https://release.solana.com/v1.18.9/install)"
```

Get wallet address from app:
1. Click "Connect Wallet"
2. Copy address that appears

Request SOL:
```bash
solana airdrop 2 YOUR_WALLET_ADDRESS --url https://api.devnet.solana.com
```

Check balance:
```bash
solana balance --url https://api.devnet.solana.com
```

### Method 2: Web Faucet

1. Visit: https://faucet.solana.com/
2. Paste wallet address
3. Click "Request"
4. Get 2 SOL instantly

### Method 3: Multiple Requests

Each wallet can request SOL every 24 hours:
```bash
# User 1: 2 SOL
solana airdrop 2 WALLET_1 --url https://api.devnet.solana.com

# User 2: 2 SOL (different address)
solana airdrop 2 WALLET_2 --url https://api.devnet.solana.com

# User 3: 2 SOL (different address)
solana airdrop 2 WALLET_3 --url https://api.devnet.solana.com
```

## Multi-User Testing Setup

### Setup 1: Same Computer, Different Browsers

**Terminal 1:**
```bash
npm run dev
```

**Browser Window 1:**
- Chrome Normal: http://localhost:3000
- Phantom wallet connected

**Browser Window 2:**
- Firefox Incognito: http://localhost:3000
- Solflare wallet connected

**Browser Window 3:**
- Safari: http://localhost:3000
- Backpack wallet connected

### Setup 2: Same Computer, Incognito Windows

```bash
# Chrome Incognito #1
Ctrl+Shift+N -> http://localhost:3000

# Chrome Incognito #2
Ctrl+Shift+N -> http://localhost:3000

# Chrome Incognito #3
Ctrl+Shift+N -> http://localhost:3000

# Each has own browser state
# Each can connect different wallet
```

### Setup 3: Multiple Computers

**Computer 1 (Server):**
```bash
npm run dev
```

**Get Local IP:**
```bash
# Mac
ipconfig getifaddr en0

# Linux
hostname -I | awk '{print $1}'

# Windows
ipconfig | grep "IPv4"
```

Example output: `192.168.1.100`

**Computer 2 (Client):**
```
Open browser: http://192.168.1.100:3000
```

**Computer 3 (Client):**
```
Open browser: http://192.168.1.100:3000
```

⚠️ Both computers must be on same WiFi network!

## Troubleshooting Setup

### "Port 3000 already in use"

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
npm run dev -- -p 3001
# Then visit http://localhost:3001
```

### "Cannot find module"

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### "RPC endpoint unreachable"

```bash
# Test RPC connection
curl https://api.devnet.solana.com/health

# If fails, use alternative
# Edit .env.local and change RPC endpoint
```

### "Wallet extension not detected"

1. Install wallet extension in browser
2. Refresh page
3. Click "Connect Wallet"
4. Approve in extension

### ".env.local not loading"

```bash
# Make sure file exists
ls -la client/.env.local

# Restart server
npm run dev
```

## Development Workflow

### Day 1: Single User Setup

```bash
1. npm run dev
2. Open http://localhost:3000
3. Connect wallet
4. Get 2 SOL
5. Create challenge
6. View on Explorer
7. End challenge
```

### Day 2: Two Users

```bash
1. npm run dev (leave running)
2. Open http://localhost:3000 in Chrome
3. Connect Wallet A
4. Get 2 SOL

5. Open http://localhost:3000 in Firefox Incognito
6. Connect Wallet B
7. Get 2 SOL

8. User A creates challenge
9. User B joins challenge
10. Verify both see updated pool
```

### Day 3: Testing Edge Cases

```bash
1. Create challenge with minimum stake (0.02 SOL)
2. Create challenge with longer duration
3. Multiple users join same challenge
4. Users submit different scores
5. Creator ends challenge
6. Verify payouts correctly distributed
```

## Monitoring & Debugging

### Server Logs

Watch for errors:
```bash
# Terminal shows:
> Ready in 1.2s
```

If it hangs:
- Check if port 3000 is available
- Check if dependencies installed
- Try: `npm cache clean --force`

### Browser DevTools

Press F12 to open:

**Console Tab:**
- Check for JavaScript errors
- Watch for network failures
- See wallet connection logs

**Network Tab:**
- Monitor API calls
- Check response times
- Verify RPC requests

**Application Tab:**
- View LocalStorage
- Check cookies
- Inspect IndexedDB

### Solana Explorer

Check every transaction:
1. Copy signature from app toast
2. Visit: https://explorer.solana.com/?cluster=devnet
3. Paste signature
4. See full transaction details

## Performance Tips

### Faster Development

```bash
# Skip TypeScript checking (faster)
npm run dev -- --no-lint

# Build only what changed
npm run build -- --profile

# Monitor memory usage
npm run dev 2>&1 | tee dev.log
```

### Faster Testing

- Use same browser window when possible
- Minimize app when not testing
- Close other tabs to free RAM
- Disable browser extensions except wallet

### Faster RPC

```bash
# Use local RPC (if running locally)
# Or use faster endpoint:
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com

# Avoid free tier RPC during testing
# Consider paid tier for consistent speed
```

## Next Steps

✅ Setup complete!

Now:
1. Start server: `npm run dev`
2. Get test SOL
3. Create first challenge
4. Invite testers
5. Monitor on Explorer
6. Collect feedback

Then:
- [ ] Load test with many users
- [ ] Test on testnet
- [ ] Prepare for mainnet
- [ ] Deploy to production

## Support

For issues:

1. **Check logs** - See terminal output
2. **Check Explorer** - Verify transactions
3. **Check wallet** - Ensure it's connected
4. **Restart server** - `Ctrl+C` then `npm run dev`
5. **Clear cache** - `rm -rf .next`

## Resources

- **Next.js Docs:** https://nextjs.org/docs
- **Solana Docs:** https://docs.solana.com/
- **Anchor Docs:** https://book.anchor-lang.com/
- **Explorer:** https://explorer.solana.com/?cluster=devnet
- **Faucet:** https://faucet.solana.com/
- **GitHub Issues:** Report bugs in repo

---

**You're all set! 🚀 Start with `npm run dev`**
