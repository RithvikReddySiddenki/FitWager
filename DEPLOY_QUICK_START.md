# Quick Deployment Guide - Multi-User Setup

## 🚀 Fastest Way to Deploy for Multiple Users

### Step 1: Deploy Solana Program (5 minutes)

```bash
# 1. Install Solana CLI (if not installed)
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# 2. Install Anchor CLI (if not installed)
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked

# 3. Configure for devnet
solana config set --url devnet

# 4. Get SOL for deployment
solana airdrop 2

# 5. Build and deploy
cd FitWager
anchor build
anchor deploy --provider.cluster devnet

# 6. Copy the program ID from output
# Update it in programs/fitwager/src/lib.rs and Anchor.toml
# Then rebuild and redeploy:
anchor build
anchor deploy --provider.cluster devnet
```

### Step 2: Set Up Supabase (10 minutes)

1. Go to [supabase.com](https://supabase.com) → Create Project
2. Wait for project creation (~2 minutes)
3. Go to SQL Editor → Run this:

```sql
-- Copy all SQL from MULTI_USER_DEPLOYMENT.md Part 3
```

4. Copy your API keys from Settings → API

### Step 3: Deploy to Vercel (5 minutes)

1. Push code to GitHub:
```bash
git add .
git commit -m "Ready for deployment"
git push
```

2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your GitHub repo
4. Configure:
   - Root Directory: `client`
   - Framework: Next.js

5. Add Environment Variables:
```env
NEXT_PUBLIC_PROGRAM_ID=YOUR_DEPLOYED_PROGRAM_ID
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
USE_SUPABASE=true
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_SERVICE_KEY=YOUR_SERVICE_KEY
```

6. Deploy!

### Step 4: Update OAuth (2 minutes)

1. Google Cloud Console → Credentials
2. Add redirect URI: `https://your-app.vercel.app/api/google/callback`
3. Update `GOOGLE_REDIRECT_URI` in Vercel

### ✅ Done! Your app is live!

**Total time**: ~20 minutes

**Your app URL**: `https://your-project.vercel.app`

---

## What Each Part Does

- **Solana Program**: Handles blockchain transactions (on-chain)
- **Supabase**: Shared database for all users (off-chain data)
- **Vercel**: Hosts your app (frontend + API routes)
- **RPC Endpoint**: Connects to Solana network

---

## Testing Multi-User

1. Open app in Browser 1 → Create challenge
2. Open app in Browser 2 (or incognito) → Should see challenge
3. Both users can join, submit scores, etc.

---

## Need Help?

See `MULTI_USER_DEPLOYMENT.md` for detailed instructions.
