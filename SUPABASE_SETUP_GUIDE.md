# Supabase Setup & Integration Guide

## Overview
Your FitWager app now uses Supabase for cloud database storage. You have created two tables:
- `users` - Stores user authentication data and OAuth tokens
- `competitions` - Stores fitness challenge/competition data

## Table Schemas

### 1. `users` Table
Stores user account information and OAuth credentials for Google Fit integration.

**Columns:**
- `id` (text, primary) - Wallet public key
- `googleId` (text, optional) - Google user identifier
- `googleEmail` (text, optional) - User's Google email
- `googleAccessToken` (text, optional) - OAuth access token (expires)
- `googleRefreshToken` (text, optional) - OAuth refresh token (long-lived)
- `googleTokenExpiry` (number, optional) - Token expiration timestamp
- `createdAt` (number) - Account creation timestamp
- `updatedAt` (number) - Last update timestamp

**Usage:**
```typescript
// Get user's OAuth tokens
const user = await getUser("walletAddress");

// Save/update user
const user = await upsertUser({
  id: "userWalletAddress",
  googleEmail: "user@gmail.com",
  googleAccessToken: "...",
  googleRefreshToken: "...",
  googleTokenExpiry: 1234567890,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});
```

### 2. `competitions` Table
Stores fitness challenge metadata. Internal name is "challenges" in code, but table is "competitions" in Supabase.

**Columns:**
- `id` (text, primary) - Challenge PDA (on-chain identifier)
- `name` (text) - Challenge title/name
- `description` (text, optional) - Challenge description
- `creator` (text) - Creator's wallet address
- `challenge_type` (text) - Type: 'steps', 'distance', 'duration', or 'calories'
- `goal` (number) - Target value for the challenge
- `sol_amount` (number) - Entry fee in SOL
- `is_usdc` (boolean) - Whether it uses USDC instead of SOL (default: false)
- `is_public` (boolean) - Whether challenge is public (default: true)
- `start_time` (number) - Challenge start timestamp
- `end_time` (number) - Challenge end timestamp
- `duration_days` (number) - Challenge duration in days
- `status` (text) - 'active', 'ended', or 'cancelled'
- `created_at` (timestamp) - When created
- `updated_at` (timestamp) - When last updated

**Usage:**
```typescript
// Create a new challenge
const challenge = await upsertChallenge({
  id: "challengePDA123",
  title: "10K Steps Daily",
  description: "Walk 10,000 steps every day",
  creator: "walletAddress",
  challengeType: "steps",
  goal: 10000,
  entryFee: 0.25,
  isUsdc: false,
  isPublic: true,
  startTime: Math.floor(Date.now() / 1000),
  endTime: Math.floor(Date.now() / 1000) + (7 * 86400), // 7 days
  status: "active",
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

// Get a specific challenge
const challenge = await getChallenge("challengePDA123");

// List all public active challenges
const challenges = await listChallenges({
  filter: "active",
  isPublic: true,
});

// List challenges by creator
const myCreated = await listChallenges({
  creator: "myWalletAddress",
});
```

## Schema Mapping (Internal ↔ Supabase)

The app automatically converts between your internal format and Supabase column names:

| Internal Name | Supabase Column | Notes |
|--------------|-----------------|-------|
| `title` | `name` | Challenge name |
| `entryFee` | `sol_amount` | Fee in SOL |
| `isUsdc` | `is_usdc` | Boolean flag |
| `isPublic` | `is_public` | Boolean flag |
| `challengeType` | `challenge_type` | Type of challenge |
| `createdAt` | `created_at` | Stored as ISO string in DB |
| `updatedAt` | `updated_at` | Stored as ISO string in DB |

**Helper Functions:**
- `normalizeCompetitionData()` - Converts Supabase data → internal format
- `denormalizeCompetitionData()` - Converts internal format → Supabase format

These handle all the mapping automatically.

## Environment Setup

### Step 1: Add Supabase Environment Variables

Add these to your `.env.local` (frontend):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

For the **backend** (used in API routes), create a `.env` file:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
```

### Step 2: Get Your Keys

1. Go to [Supabase Dashboard](https://supabase.com)
2. Select your project
3. Go to **Settings → API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_KEY` (⚠️ Keep secret!)

### Step 3: Enable Row Level Security (Optional but Recommended)

For production, enable RLS:
1. Go to **Authentication → Policies**
2. Create policies to control who can read/write

## How the App Uses These Tables

### Creating a Challenge
```
User creates challenge on `/challenges/create`
  ↓
POST /api/challenges/create
  ↓
Store challenge in Supabase 'competitions' table
  ↓
Challenge appears on `/challenges/public` for all users
```

### Viewing Challenges
```
User visits `/challenges/public`
  ↓
GET /api/challenges/list
  ↓
Fetch from Supabase 'competitions' table
  ↓
Display with title, description, entry fee
```

### User Data
```
User connects Google Fit
  ↓
OAuth tokens stored in 'users' table
  ↓
Tokens used to fetch fitness data from Google Fit API
```

## Storage Modes

The app automatically switches based on environment variables:

### Development (File-Based, No Supabase Needed)
- If `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are not set
- Challenges saved to `.fitwager_data/challenges.json`
- Data persists on your local disk
- Good for testing without database

### Production (Supabase, Cloud-Based)
- If `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are set
- All data synced to Supabase in real-time
- Data shared across multiple server instances
- Accessible from anywhere

## Testing the Integration

### 1. Verify Supabase Connection
```bash
# Check if your .env file is loaded
cd client
npm run dev

# Look for logs indicating Supabase usage
# Should see: "Supabase client initialized" (if configured)
```

### 2. Create a Test Challenge
1. Go to `http://localhost:3000/challenges/create`
2. Create a challenge
3. Check your Supabase dashboard:
   - Go to **Table Editor**
   - Select **competitions** table
   - You should see your new challenge!

### 3. Verify It Appears on Public Page
1. Go to `http://localhost:3000/challenges/public`
2. You should see your challenge with:
   - Title (from `name` column)
   - Entry fee (from `sol_amount` column)
   - Description (from `description` column)
   - Status and time remaining

## Common Issues

### "Supabase client not available"
- **Cause:** Missing `SUPABASE_URL` or `SUPABASE_SERVICE_KEY` in environment
- **Fix:** Add both keys to `.env` file in the `client` directory

### Challenges not showing up
- **Cause 1:** Using file storage instead of Supabase (see above)
- **Cause 2:** Supabase table has wrong column names
- **Fix:** Verify your table matches the schema above

### Can't find challenges in Supabase
- **Cause:** Challenges are being created but not syncing
- **Fix:** Check that `SUPABASE_SERVICE_KEY` is set (not the anon key)

### OAuth tokens not saving
- **Cause:** `users` table not properly configured
- **Fix:** Create table with columns: id, googleId, googleEmail, googleAccessToken, googleRefreshToken, googleTokenExpiry, createdAt, updatedAt

## Next Steps

1. ✅ **Create tables** - Done! You have `users` and `competitions`
2. ✅ **Add environment variables** - Add to `.env.local` for frontend
3. ⏳ **Add backend env** - Create `.env` with `SUPABASE_SERVICE_KEY`
4. ⏳ **Test the integration** - Follow testing steps above
5. ⏳ **Enable Row Level Security** - For production security
6. ⏳ **Add missing tables** - If you want to track participants and verifications:
   - `participants` - Track who joined each challenge
   - `verifications` - Store fitness verification results

## Queries You Can Run

### Find all challenges by a creator
```sql
SELECT * FROM competitions WHERE creator = 'wallet_address';
```

### Find all active public challenges
```sql
SELECT * FROM competitions WHERE status = 'active' AND is_public = true;
```

### Find challenges by type
```sql
SELECT * FROM competitions WHERE challenge_type = 'steps';
```

### Get user's OAuth tokens
```sql
SELECT googleAccessToken, googleRefreshToken FROM users WHERE id = 'wallet_address';
```

## Support

If you need help:
1. Check Supabase logs: Dashboard → Logs
2. Verify environment variables are set
3. Check TypeScript console for error messages
4. Review the `src/lib/db/storage.ts` file for implementation details
