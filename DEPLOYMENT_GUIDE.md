# FitWager Deployment Guide

Complete guide for deploying FitWager to Solana Devnet with Google Fit and Circle integration.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Anchor Program Deployment](#anchor-program-deployment)
4. [Google OAuth Setup](#google-oauth-setup)
5. [Circle USDC Setup](#circle-usdc-setup)
6. [Database Setup (Optional)](#database-setup)
7. [Frontend Deployment](#frontend-deployment)
8. [Testing End-to-End](#testing-end-to-end)

---

## Prerequisites

Before starting, ensure you have:

- Node.js 18+ installed
- Rust and Cargo installed
- Solana CLI installed (`solana --version`)
- Anchor CLI installed (`anchor --version`)
- A Solana wallet with devnet SOL

### Install Solana CLI

```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
```

### Install Anchor CLI

```bash
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked
```

---

## Environment Setup

### 1. Create Environment File

Create `client/.env.local` with the following variables:

```env
# Solana Configuration
NEXT_PUBLIC_PROGRAM_ID=YOUR_DEPLOYED_PROGRAM_ID
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
NEXT_PUBLIC_PLATFORM_WALLET=YOUR_PLATFORM_WALLET_ADDRESS

# Google OAuth (see Google OAuth Setup section)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback

# Circle API (see Circle Setup section)
CIRCLE_API_KEY=your-circle-api-key
CIRCLE_API_URL=https://api-sandbox.circle.com

# Database (optional)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key

# Security
VERIFICATION_SECRET=generate-a-random-32-char-string
```

---

## Anchor Program Deployment

### 1. Configure Solana CLI for Devnet

```bash
# Set cluster to devnet
solana config set --url devnet

# Create a new keypair if needed
solana-keygen new --outfile ~/.config/solana/id.json

# Airdrop SOL for deployment
solana airdrop 2
```

### 2. Build the Anchor Program

```bash
# Navigate to project root
cd FitWager

# Build the program
anchor build
```

### 3. Get Program ID

```bash
# Get the program keypair address
solana address -k target/deploy/fitwager-keypair.json
```

### 4. Update Program ID

Update the program ID in two places:

**`programs/fitwager/src/lib.rs`:**
```rust
declare_id!("YOUR_PROGRAM_ID_HERE");
```

**`Anchor.toml`:**
```toml
[programs.devnet]
fitwager = "YOUR_PROGRAM_ID_HERE"
```

### 5. Rebuild and Deploy

```bash
# Rebuild with new ID
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

### 6. Update Frontend

Update `client/.env.local`:
```env
NEXT_PUBLIC_PROGRAM_ID=YOUR_DEPLOYED_PROGRAM_ID
```

Update `client/src/utils/constants.ts` if needed.

---

## Google OAuth Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable the **Fitness API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Fitness API"
   - Click "Enable"

### 2. Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type
3. Fill in application details:
   - App name: "FitWager"
   - User support email: your email
   - Developer contact: your email
4. Add scopes:
   - `https://www.googleapis.com/auth/fitness.activity.read`
   - `https://www.googleapis.com/auth/fitness.location.read`
   - `https://www.googleapis.com/auth/fitness.body.read`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`

### 3. Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application"
4. Configure:
   - Name: "FitWager Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - `https://your-domain.com`
   - Authorized redirect URIs:
     - `http://localhost:3000/api/google/callback`
     - `https://your-domain.com/api/google/callback`
5. Copy Client ID and Client Secret

### 4. Update Environment

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback
```

---

## Circle USDC Setup

### 1. Create Circle Account

1. Go to [Circle Developer Console](https://developers.circle.com)
2. Create an account
3. Get API key from the dashboard

### 2. Configure for Sandbox

For testing, use sandbox mode:

```env
CIRCLE_API_KEY=your-sandbox-api-key
CIRCLE_API_URL=https://api-sandbox.circle.com
```

### 3. USDC Token Addresses

The app uses these USDC addresses:

- **Devnet**: `Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr`
- **Mainnet**: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`

---

## Database Setup

For production, set up Supabase for data persistence.

### 1. Create Supabase Project

1. Go to [Supabase](https://supabase.com)
2. Create a new project

### 2. Run Database Migrations

Create these tables in Supabase SQL editor:

```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  google_id TEXT UNIQUE,
  google_email TEXT,
  google_access_token TEXT,
  google_refresh_token TEXT,
  google_token_expiry BIGINT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- Challenges table
CREATE TABLE challenges (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  creator TEXT NOT NULL,
  challenge_type TEXT NOT NULL,
  goal BIGINT NOT NULL,
  entry_fee BIGINT NOT NULL,
  is_usdc BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT TRUE,
  start_time BIGINT NOT NULL,
  end_time BIGINT NOT NULL,
  status TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- Participants table
CREATE TABLE participants (
  id TEXT PRIMARY KEY,
  challenge_id TEXT NOT NULL REFERENCES challenges(id),
  wallet TEXT NOT NULL,
  score BIGINT DEFAULT 0,
  has_joined BOOLEAN DEFAULT FALSE,
  has_submitted BOOLEAN DEFAULT FALSE,
  joined_at BIGINT,
  last_verification BIGINT,
  verification_data JSONB
);

-- Verifications table
CREATE TABLE verifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  challenge_id TEXT NOT NULL,
  challenge_type TEXT NOT NULL,
  start_time BIGINT NOT NULL,
  end_time BIGINT NOT NULL,
  raw_data JSONB,
  calculated_score BIGINT NOT NULL,
  meets_goal BOOLEAN NOT NULL,
  verified_at BIGINT NOT NULL,
  verification_hash TEXT NOT NULL
);

-- Indexes
CREATE INDEX idx_challenges_creator ON challenges(creator);
CREATE INDEX idx_challenges_status ON challenges(status);
CREATE INDEX idx_participants_challenge ON participants(challenge_id);
CREATE INDEX idx_participants_wallet ON participants(wallet);
```

### 3. Update Environment

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

---

## Frontend Deployment

### 1. Install Dependencies

```bash
cd client
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

### 3. Build for Production

```bash
npm run build
```

### 4. Deploy to Vercel

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

---

## Testing End-to-End

### 1. Test Wallet Connection

1. Open app at `http://localhost:3000`
2. Click "Connect" and connect Phantom wallet
3. Ensure wallet shows connected state

### 2. Test Google Fit Connection

1. Go to Dashboard
2. Click "Connect Google Fit"
3. Complete OAuth flow
4. Verify fitness data displays

### 3. Test Challenge Creation

1. Click "Create Challenge"
2. Fill in details:
   - Title: "Test Steps Challenge"
   - Type: Steps
   - Goal: 10000
   - Entry Fee: 0.1 SOL
   - Duration: 7 days
3. Confirm transaction
4. Verify challenge appears in list

### 4. Test Challenge Join

1. Use different wallet
2. Browse to challenge
3. Click "Join"
4. Confirm transaction

### 5. Test Score Submission

1. Connect Google Fit
2. Click "Verify Fitness Data"
3. Review verified score
4. Click "Submit Score"
5. Confirm transaction

### 6. Test Challenge End

1. Wait for challenge end time
2. As creator, click "End Challenge"
3. Verify winner receives payout

---

## Troubleshooting

### Common Issues

**"Program not deployed"**
- Ensure you've run `anchor deploy`
- Verify program ID matches in all files

**"Google OAuth error"**
- Check redirect URI matches exactly
- Ensure scopes are added to consent screen
- Verify client ID/secret are correct

**"Wallet connection fails"**
- Use Chrome/Brave with Phantom
- Ensure wallet is on devnet

**"Transaction fails"**
- Check wallet has enough SOL
- Verify program ID is correct
- Check account constraints

### Getting Help

- Check browser console for errors
- Review Solana transaction on explorer
- Check API logs in terminal

---

## Production Checklist

Before going to mainnet:

- [ ] Audit smart contract code
- [ ] Update program ID to mainnet deployment
- [ ] Update RPC endpoint to mainnet
- [ ] Update USDC address to mainnet
- [ ] Configure production OAuth redirect URIs
- [ ] Switch Circle to production mode
- [ ] Set up production database
- [ ] Configure proper error handling
- [ ] Add rate limiting to APIs
- [ ] Set up monitoring and logging
- [ ] Test all flows on mainnet

