# Multi-User Deployment Guide

Complete guide to deploy FitWager so multiple users can use it simultaneously.

## Overview

To support multiple users, you need to deploy:
1. **Solana Program** (Smart Contract) - Handles on-chain transactions
2. **Next.js App** (Frontend + Backend) - Hosted on Vercel/Railway/etc.
3. **Database** (Supabase or SQLite) - Shared data storage
4. **RPC Endpoint** - Accessible Solana RPC

---

## Part 1: Deploy Solana Program

### Step 1: Install Prerequisites

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked

# Verify installations
solana --version
anchor --version
```

### Step 2: Configure Solana CLI

```bash
# For Devnet (testing)
solana config set --url devnet

# For Mainnet (production)
# solana config set --url mainnet

# Create/use a keypair
solana-keygen new --outfile ~/.config/solana/id.json

# Get your wallet address
solana address

# Airdrop SOL (devnet only - free)
solana airdrop 2
```

### Step 3: Build and Deploy Program

```bash
# Navigate to project root
cd FitWager

# Build the program
anchor build

# Get the program ID
solana address -k target/deploy/fitwager-keypair.json
# Copy this ID - you'll need it!

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Or deploy to mainnet (costs real SOL)
# anchor deploy --provider.cluster mainnet
```

### Step 4: Update Program ID

After deployment, update these files:

**`programs/fitwager/src/lib.rs`:**
```rust
declare_id!("YOUR_DEPLOYED_PROGRAM_ID_HERE");
```

**`Anchor.toml`:**
```toml
[programs.devnet]
fitwager = "YOUR_DEPLOYED_PROGRAM_ID_HERE"
```

**Rebuild and redeploy:**
```bash
anchor build
anchor deploy --provider.cluster devnet
```

---

## Part 2: Deploy Next.js App (Frontend + Backend)

### Option A: Deploy to Vercel (Recommended)

#### Step 1: Prepare for Deployment

```bash
cd client

# Build locally to check for errors
npm run build
```

#### Step 2: Push to GitHub

```bash
# Initialize git if not already
git init
git add .
git commit -m "Ready for deployment"
git remote add origin https://github.com/yourusername/fitwager.git
git push -u origin main
```

#### Step 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up/login with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

#### Step 4: Add Environment Variables

In Vercel dashboard, go to Settings → Environment Variables and add:

```env
# Solana Configuration
NEXT_PUBLIC_PROGRAM_ID=YOUR_DEPLOYED_PROGRAM_ID
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com

# Google Fit (if using)
NEXT_PUBLIC_GOOGLE_FIT_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Circle (if using)
NEXT_PUBLIC_CIRCLE_API_KEY=your-api-key

# Database - IMPORTANT for multi-user! (Choose ONE)
# Option 1: Firebase (Recommended - easiest)
USE_FIREBASE=true
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Option 2: Supabase
# USE_SUPABASE=true
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_SERVICE_KEY=your-service-key
```

#### Step 5: Deploy

Click "Deploy" - Vercel will build and deploy your app!

**Your app will be live at**: `https://your-project.vercel.app`

### Option B: Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway will auto-detect Next.js
6. Add environment variables (same as Vercel)
7. Deploy!

### Option C: Deploy to Other Platforms

- **Netlify**: Similar to Vercel
- **Render**: Good for full-stack apps
- **Fly.io**: Good for global distribution
- **AWS/GCP/Azure**: More complex but more control

---

## Part 3: Set Up Shared Database (Required for Multi-User)

### ⚠️ Important: File Storage Won't Work for Multi-User!

File storage (`.fitwager_data/challenges.json`) only works for single-server deployments. For multiple users, you **must** use a shared database.

### Option A: Firebase (Recommended - Easy Setup)

#### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Enter project name: "FitWager"
4. Enable Google Analytics (optional)
5. Click "Create project"

#### Step 2: Enable Firestore

1. Go to "Build" → "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode"
4. Select location
5. Click "Enable"

#### Step 3: Get API Keys

1. Go to Project Settings (gear icon)
2. Scroll to "Your apps"
3. Click "Web" icon (`</>`)
4. Register app: "FitWager Web"
5. Copy the `firebaseConfig` values

#### Step 4: Set Up Security Rules

Go to Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // For development - tighten for production!
    }
  }
}
```

#### Step 5: Update Environment Variables

Add to your deployment platform:

```env
USE_FIREBASE=true
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

**That's it!** Firebase automatically creates collections on first use.

### Option B: Supabase

#### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/login
3. Click "New Project"
4. Fill in:
   - **Name**: FitWager
   - **Database Password**: (save this!)
   - **Region**: Choose closest to your users
5. Wait for project to be created (~2 minutes)

#### Step 2: Get API Keys

1. Go to Project Settings → API
2. Copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...`
   - **service_role key**: `eyJhbGc...` (keep secret!)

#### Step 3: Set Up Tables

Go to SQL Editor and run:

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  google_id TEXT,
  google_email TEXT,
  google_access_token TEXT,
  google_refresh_token TEXT,
  google_token_expiry BIGINT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- Competitions (challenges) table
CREATE TABLE IF NOT EXISTS competitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  creator TEXT NOT NULL,
  challenge_type TEXT NOT NULL,
  goal REAL NOT NULL,
  sol_amount REAL NOT NULL,
  is_usdc INTEGER DEFAULT 0,
  is_public INTEGER DEFAULT 1,
  start_time BIGINT NOT NULL,
  end_time BIGINT NOT NULL,
  duration_days INTEGER,
  status TEXT DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Participants table
CREATE TABLE IF NOT EXISTS participants (
  id TEXT PRIMARY KEY,
  challenge_id TEXT NOT NULL,
  wallet TEXT NOT NULL,
  score REAL DEFAULT 0,
  has_joined INTEGER DEFAULT 0,
  has_submitted INTEGER DEFAULT 0,
  joined_at BIGINT,
  last_verification BIGINT
);

-- Verifications table
CREATE TABLE IF NOT EXISTS verifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  challenge_id TEXT NOT NULL,
  challenge_type TEXT NOT NULL,
  start_time BIGINT NOT NULL,
  end_time BIGINT NOT NULL,
  calculated_score REAL NOT NULL,
  meets_goal INTEGER DEFAULT 0,
  verified_at BIGINT NOT NULL,
  verification_hash TEXT,
  raw_data TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_competitions_status ON competitions(status);
CREATE INDEX IF NOT EXISTS idx_competitions_public ON competitions(is_public);
CREATE INDEX IF NOT EXISTS idx_competitions_creator ON competitions(creator);
CREATE INDEX IF NOT EXISTS idx_participants_challenge ON participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_verifications_challenge ON verifications(challenge_id);
```

#### Step 4: Configure Row Level Security (RLS)

Go to Authentication → Policies and enable RLS, or run:

```sql
-- Enable RLS
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;

-- Allow public read access to public competitions
CREATE POLICY "Public competitions are viewable by everyone"
  ON competitions FOR SELECT
  USING (is_public = 1);

-- Allow authenticated users to insert
CREATE POLICY "Users can create competitions"
  ON competitions FOR INSERT
  WITH CHECK (true);

-- Allow users to update their own competitions
CREATE POLICY "Users can update own competitions"
  ON competitions FOR UPDATE
  USING (creator = current_setting('request.jwt.claims', true)::json->>'sub');
```

#### Step 5: Update Environment Variables

Add to your deployment platform (Vercel, Railway, etc.):

```env
USE_SUPABASE=true
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...
```

### Option B: PostgreSQL (Self-Hosted)

If you prefer self-hosting:

1. Set up PostgreSQL on Railway, Render, or AWS RDS
2. Run the same SQL schema as above
3. Use connection string in environment variables

---

## Part 4: Configure RPC Endpoint

### For Devnet (Testing)

Use public RPC (free but rate-limited):
```env
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
```

### For Mainnet (Production)

**Recommended**: Use a paid RPC provider for better reliability:

1. **Helius** (Recommended):
   - Sign up at [helius.dev](https://helius.dev)
   - Get free tier: 100k requests/day
   - Add API key to RPC URL

2. **QuickNode**:
   - Sign up at [quicknode.com](https://quicknode.com)
   - Create endpoint
   - Copy RPC URL

3. **Alchemy**:
   - Sign up at [alchemy.com](https://alchemy.com)
   - Create Solana app
   - Get RPC URL

**Update environment variable:**
```env
NEXT_PUBLIC_RPC_ENDPOINT=https://your-rpc-url.com
```

---

## Part 5: Update OAuth Redirect URIs

### Google Fit OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to APIs & Services → Credentials
3. Edit your OAuth 2.0 Client
4. Add authorized redirect URIs:
   - `https://your-app.vercel.app/api/google/callback`
   - `https://your-domain.com/api/google/callback`
5. Save

### Update Environment Variables

```env
GOOGLE_REDIRECT_URI=https://your-app.vercel.app/api/google/callback
```

---

## Part 6: Final Configuration Checklist

### Environment Variables (All Platforms)

```env
# Solana
NEXT_PUBLIC_PROGRAM_ID=YOUR_DEPLOYED_PROGRAM_ID
NEXT_PUBLIC_SOLANA_CLUSTER=devnet  # or mainnet
NEXT_PUBLIC_RPC_ENDPOINT=https://your-rpc-url.com

# Database (Choose one)
# Option 1: Firebase (Recommended - easiest)
USE_FIREBASE=true
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Option 2: Supabase
# USE_SUPABASE=true
# NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# SUPABASE_URL=https://xxxxx.supabase.co
# SUPABASE_SERVICE_KEY=your-service-key

# Google Fit
NEXT_PUBLIC_GOOGLE_FIT_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://your-app.vercel.app/api/google/callback

# Circle (optional)
NEXT_PUBLIC_CIRCLE_API_KEY=your-api-key
```

---

## Part 7: Testing Multi-User Deployment

### Test Checklist

1. **Multiple Users Can Access**:
   - [ ] User 1 can create challenges
   - [ ] User 2 can see User 1's challenges
   - [ ] User 2 can join User 1's challenges
   - [ ] Both users see the same challenge list

2. **Database Persistence**:
   - [ ] Challenges persist after server restart
   - [ ] Data is shared across all users
   - [ ] No data loss

3. **Transactions Work**:
   - [ ] Users can create paid challenges
   - [ ] Users can join challenges
   - [ ] Transactions appear on Solana Explorer

4. **Performance**:
   - [ ] App loads quickly
   - [ ] No timeout errors
   - [ ] RPC endpoint is responsive

---

## Part 8: Production Checklist

Before going live:

- [ ] Program deployed to mainnet (or devnet for testing)
- [ ] Program ID updated in all config files
- [ ] Database set up (Supabase or PostgreSQL)
- [ ] RPC endpoint configured (paid provider recommended)
- [ ] OAuth redirect URIs updated
- [ ] Environment variables set in deployment platform
- [ ] Domain name configured (optional but recommended)
- [ ] SSL certificate active (automatic with Vercel/Railway)
- [ ] Error monitoring set up (Sentry, LogRocket, etc.)
- [ ] Analytics configured (optional)

---

## Quick Deploy Commands

### One-Command Deploy (After Setup)

```bash
# 1. Deploy Solana program
cd FitWager
anchor deploy --provider.cluster devnet

# 2. Push to GitHub
git add .
git commit -m "Deploy to production"
git push

# 3. Vercel will auto-deploy (if connected)
# Or manually trigger in Vercel dashboard
```

---

## Troubleshooting

### "Challenges not appearing for other users"
- **Fix**: Make sure `USE_SUPABASE=true` is set
- **Fix**: Check Supabase RLS policies allow public reads

### "Transaction failed"
- **Fix**: Verify program is deployed
- **Fix**: Check RPC endpoint is accessible
- **Fix**: Ensure wallet has SOL for fees

### "Database connection failed"
- **Fix**: Check Supabase credentials
- **Fix**: Verify RLS policies are configured
- **Fix**: Check network connectivity

### "OAuth redirect error"
- **Fix**: Update redirect URI in Google Cloud Console
- **Fix**: Match exactly (including https/http)

---

## Cost Estimates

### Free Tier (Devnet Testing)
- **Vercel**: Free (hobby plan)
- **Supabase**: Free (500MB database, 2GB bandwidth)
- **RPC**: Free (public endpoints, rate-limited)
- **Solana**: Free (devnet SOL is free)

### Production (Mainnet)
- **Vercel**: $20/month (pro plan recommended)
- **Supabase**: $25/month (pro plan)
- **RPC**: $0-50/month (depending on usage)
- **Solana**: Transaction fees (~$0.00025 per transaction)

**Total**: ~$45-95/month for small to medium usage

---

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Solana Docs**: https://docs.solana.com
- **Anchor Docs**: https://book.anchor-lang.com

---

## Summary

To deploy for multiple users:

1. ✅ **Deploy Solana program** to devnet/mainnet
2. ✅ **Deploy Next.js app** to Vercel/Railway
3. ✅ **Set up Supabase** for shared database
4. ✅ **Configure RPC endpoint** (paid provider for production)
5. ✅ **Update OAuth redirect URIs**
6. ✅ **Set all environment variables**
7. ✅ **Test with multiple users**

Your app will be live and accessible to all users! 🚀
