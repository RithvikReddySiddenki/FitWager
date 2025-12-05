# Environment Variables Setup Guide

This guide explains how to set up your environment variables for FitWager.

## Quick Start

1. **Create `.env.local`** in the `client/` directory for frontend variables
2. **Create `.env`** in the `client/` directory for backend variables (server-side only)

## Frontend Variables (.env.local)

Create `client/.env.local` with the following:

```env
# ============================================
# Solana Configuration (Required)
# ============================================
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=Fg6PaFpoGXkYsidMpWxqSW1JmAxo9ZPVknpYAH97PvX1

# ============================================
# Supabase Configuration (Optional - for cloud storage)
# ============================================
# Get these from: https://supabase.com/dashboard → Settings → API
# NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# Google Fit OAuth (Optional)
# ============================================
# NEXT_PUBLIC_GOOGLE_FIT_CLIENT_ID=your-client-id.apps.googleusercontent.com

# ============================================
# Circle Payments (Optional)
# ============================================
# NEXT_PUBLIC_CIRCLE_API_KEY=your-circle-api-key
```

## Backend Variables (.env)

Create `client/.env` with the following:

```env
# ============================================
# Supabase Configuration (Required for cloud storage)
# ============================================
# Get these from: https://supabase.com/dashboard → Settings → API
# SUPABASE_URL=https://your-project-id.supabase.co
# SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# Google OAuth (Optional - for Google Fit integration)
# ============================================
# GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
# GOOGLE_CLIENT_SECRET=your-client-secret
# GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback

# ============================================
# Circle Payments (Optional)
# ============================================
# CIRCLE_API_KEY=your-circle-api-key
# CIRCLE_API_URL=https://api-sandbox.circle.com

# ============================================
# Node Environment
# ============================================
NODE_ENV=development
```

## Supabase Setup

### To Enable Supabase (Cloud Storage):

1. **Get your Supabase keys:**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Go to **Settings → API**
   - Copy:
     - **Project URL** → Use for both `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL`
     - **anon public key** → Use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - **service_role key** → Use for `SUPABASE_SERVICE_KEY` (⚠️ Keep secret!)

2. **Add to `.env.local` (frontend):**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Add to `.env` (backend):**
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. **Restart your dev server:**
   ```bash
   cd client
   npm run dev
   ```

### Without Supabase (File Storage Mode):

If you don't set `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`, the app will automatically use file-based storage:
- Challenges saved to `.fitwager_data/challenges.json`
- Data persists locally
- Good for development/testing

## Verification

After setting up your environment variables:

1. **Check the console logs** when starting the dev server:
   - If Supabase is configured: `[Storage] Supabase client initialized successfully`
   - If not configured: `[Storage] Supabase not configured - using file storage mode`

2. **Test Supabase connection:**
   - Create a challenge at `/challenges/create`
   - Check Supabase dashboard → Table Editor → `competitions` table
   - Your challenge should appear!

## Troubleshooting

### "Supabase client not available"
- Make sure `.env` file has `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
- Restart the dev server after adding environment variables
- Check that the keys are correct (URL should start with `https://`, key should start with `eyJ`)

### "Table 'competitions' not found"
- Create the table in Supabase first
- See `SUPABASE_SETUP_GUIDE.md` for table schemas

### Environment variables not loading
- Make sure files are named exactly `.env.local` and `.env` (not `.env.local.txt`)
- Restart the dev server after creating/modifying environment files
- In Next.js, only `NEXT_PUBLIC_*` variables are available in the browser

## Security Notes

- **`.env.local`**: Contains public keys (safe to expose in frontend)
- **`.env`**: Contains secrets (NEVER commit to git!)
- Both files are already in `.gitignore`
