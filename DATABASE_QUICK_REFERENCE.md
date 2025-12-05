# FitWager Database Quick Reference

## Your Supabase Tables

### `users` Table
- Stores: Wallet address, Google OAuth tokens
- Used for: Google Fit integration, user authentication
- Key fields: `id` (wallet), `googleAccessToken`, `googleRefreshToken`

### `competitions` Table  
- Stores: Fitness challenges/competitions
- Used for: Challenge listing, creation, display
- Key fields: `id`, `name`, `sol_amount`, `description`, `creator`, `status`

## Quick API Usage

### Challenges
```typescript
import { upsertChallenge, listChallenges, getChallenge } from '@/lib/db/storage';

// Create/Update a challenge
await upsertChallenge({
  id: challengePDA,
  title: "10K Steps",
  description: "Walk 10,000 steps daily",
  creator: "walletAddress",
  challengeType: "steps",
  goal: 10000,
  entryFee: 0.25,
  isUsdc: false,
  isPublic: true,
  startTime: Math.floor(Date.now() / 1000),
  endTime: Math.floor(Date.now() / 1000) + (7 * 86400),
  status: "active",
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

// Get a specific challenge
const challenge = await getChallenge("challengePDA");

// List challenges
const challenges = await listChallenges({ isPublic: true, filter: "active" });
```

### Users
```typescript
import { getUser, upsertUser, updateUserTokens } from '@/lib/db/storage';

// Get user
const user = await getUser("walletAddress");

// Create/Update user
await upsertUser({
  id: "walletAddress",
  googleEmail: "user@gmail.com",
  googleAccessToken: "...",
  googleRefreshToken: "...",
  googleTokenExpiry: timestamp,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

// Update just tokens
await updateUserTokens("walletAddress", {
  googleAccessToken: "new_token",
  googleRefreshToken: "new_refresh",
  googleTokenExpiry: new_expiry_timestamp,
});
```

## Environment Setup

### For Frontend (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=Fg6PaFpoGXkYsidMpWxqSW1JmAxo9ZPVknpYAH97PvX1
```

### For Backend (.env)
```env
SUPABASE_URL=your_url_here
SUPABASE_SERVICE_KEY=your_service_key_here
```

## Schema Mapping

Your code uses one format, Supabase uses another. Conversion is automatic:

```
Internal                    Supabase Column
title               →        name
entryFee            →        sol_amount  
isUsdc              →        is_usdc
isPublic            →        is_public
challengeType       →        challenge_type
createdAt           →        created_at
updatedAt           →        updated_at
```

## How Data Flows

### Creating a Challenge
```
Frontend (create form)
     ↓
/api/challenges/create
     ↓
storage.upsertChallenge()
     ↓
IF Supabase configured:
   - Convert to Supabase schema
   - Save to 'competitions' table
ELSE:
   - Save to memory store
   - Write to .fitwager_data/challenges.json
```

### Fetching Challenges
```
Frontend (/challenges/public)
     ↓
/api/challenges/list
     ↓
storage.listChallenges()
     ↓
IF Supabase configured:
   - Query 'competitions' table
   - Convert from Supabase schema
ELSE:
   - Read from .fitwager_data/challenges.json
     ↓
Display to user
```

## Testing Locally (Without Supabase)

Works out of the box! Data persists in:
```
.fitwager_data/
  └── challenges.json
```

To switch to Supabase later, just add environment variables and restart.

## Switch Storage Mode

### Use File Storage (Development)
1. Don't set `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
2. Challenges save to `.fitwager_data/challenges.json`

### Use Supabase (Production)
1. Set `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in `.env`
2. Challenges automatically sync to cloud database
3. Works across multiple servers

## Status Values

- `active` - Challenge is ongoing
- `ended` - Challenge has finished
- `cancelled` - Challenge was cancelled

## Challenge Types

- `steps` - Step count challenge
- `distance` - Distance challenge (miles/km)
- `duration` - Time/duration challenge (minutes)
- `calories` - Calories burned challenge

## Example: Create and List Challenges

```typescript
// In your API route or server action
import { upsertChallenge, listChallenges } from '@/lib/db/storage';

// 1. Create a challenge
const newChallenge = await upsertChallenge({
  id: "challenge_pda_123",
  title: "Marathon Training",
  description: "Run 100 miles this month",
  creator: "wallet123",
  challengeType: "distance",
  goal: 100,
  entryFee: 1.0,
  isUsdc: false,
  isPublic: true,
  startTime: Math.floor(Date.now() / 1000),
  endTime: Math.floor(Date.now() / 1000) + (30 * 86400), // 30 days
  status: "active",
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

// 2. List all public active challenges
const allChallenges = await listChallenges({
  isPublic: true,
  filter: "active",
});

// 3. Filter challenges by creator
const myChallenges = await listChallenges({
  creator: "wallet123",
});

// 4. Get specific challenge
const singleChallenge = await getChallenge("challenge_pda_123");
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Challenges not appearing | Check if SUPABASE_URL is set. If not, using file storage |
| "Supabase client not available" | Add SUPABASE_SERVICE_KEY to .env |
| Column names don't match | Verify your table uses snake_case: name, sol_amount, etc. |
| Data not persisting | Make sure .fitwager_data directory is writable |
| Challenges lost after restart | Set up Supabase or check .fitwager_data folder |

## File Structure

```
client/
├── .env.local              # Frontend keys (public)
├── .env                    # Backend keys (secret)
├── src/
│   └── lib/db/
│       ├── schema.ts       # Type definitions
│       └── storage.ts      # Database operations + Supabase mapping
└── .fitwager_data/
    └── challenges.json     # Local file storage (dev only)
```
