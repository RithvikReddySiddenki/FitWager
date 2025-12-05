# How to Use Your Supabase Tables

## Quick Answer

Your `users` and `competitions` tables are automatically integrated into FitWager. Here's how they work:

---

## ✅ What's Already Connected

### Challenges/Competitions
```
When you create a challenge:
  Your form → API → Supabase 'competitions' table
                      ↓ (maps title → name, entryFee → sol_amount)
                    Database saved ✓

When you view challenges:
  /challenges/public → API → Query 'competitions' table
                      ↓ (unmaps name → title, sol_amount → entryFee)
                    Display on page ✓
```

### Users
```
When you authenticate with Google:
  OAuth flow → 'users' table stores tokens
  
When accessing fitness data:
  App retrieves tokens from 'users' table
  Uses them to call Google Fit API
```

---

## 📝 Your Table Structures

### competitions Table
You created with columns:
- `id` - Challenge ID (primary key)
- `name` - Challenge title
- `sol_amount` - Entry fee in SOL
- `duration_days` - How long it runs
- `created_at` - Creation timestamp

**Add these columns for full functionality:**
- `description` (text) - Challenge description
- `creator` (text) - Creator's wallet address
- `challenge_type` (text) - 'steps', 'distance', 'duration', or 'calories'
- `goal` (number) - Target value
- `is_usdc` (boolean) - Use USDC instead of SOL?
- `is_public` (boolean) - Visible to all users?
- `start_time` (number) - Start timestamp
- `end_time` (number) - End timestamp
- `status` (text) - 'active', 'ended', or 'cancelled'
- `updated_at` (timestamp) - Last update time

### users Table
You created for storing:
- `id` - Wallet address (primary key)

**Add these columns for full functionality:**
- `googleId` (text) - Google user ID
- `googleEmail` (text) - User's Google email
- `googleAccessToken` (text) - OAuth token (expires)
- `googleRefreshToken` (text) - Refresh token (long-lived)
- `googleTokenExpiry` (number) - When token expires
- `createdAt` (number) - Account creation time
- `updatedAt` (number) - Last update time

---

## 🔄 How Data Maps Between Code and Database

When you create a challenge in your code:

```typescript
{
  title: "10K Steps",           // → stored as 'name' in DB
  entryFee: 0.25,               // → stored as 'sol_amount' in DB
  isPublic: true,               // → stored as 'is_public' in DB
  challengeType: "steps",       // → stored as 'challenge_type' in DB
  // ... other fields
}
```

The app automatically converts:
- When **saving to DB**: Internal format → Supabase format
- When **reading from DB**: Supabase format → Internal format

**Conversion happens automatically** via these functions:
- `normalizeCompetitionData()` - DB → Internal
- `denormalizeCompetitionData()` - Internal → DB

---

## 🚀 To Get Started

### Option 1: Quick Start (File Storage - No Setup Needed)
Works right now without Supabase keys!
```bash
cd client
npm run dev
# Create challenges - they save to .fitwager_data/challenges.json
```

### Option 2: Full Setup (Supabase - Cloud Storage)
1. Get keys from Supabase Dashboard (see GET_SUPABASE_KEYS.md)
2. Add to `.env.local` and `.env` files
3. Restart server
4. Everything syncs to Supabase automatically

---

## 📊 Comparison: File Storage vs Supabase

| Feature | File Storage | Supabase |
|---------|-------------|----------|
| Data persistence | Local .json file | Cloud database |
| Multi-server support | ❌ Each server has own data | ✅ All servers share |
| Backups | ❌ Manual | ✅ Automatic |
| Query capabilities | ❌ Limited | ✅ Full SQL |
| Cost | Free | Free tier available |
| Setup time | 0 minutes | 5 minutes |

---

## 💻 Code Examples

### Example 1: Create a Challenge
```typescript
import { upsertChallenge } from '@/lib/db/storage';

const challenge = await upsertChallenge({
  id: "challenge_123",
  title: "Marathon Training",           // Stored as 'name'
  description: "Train for a marathon",
  creator: "wallet_address",
  challengeType: "distance",            // Stored as 'challenge_type'
  goal: 100,
  entryFee: 1.0,                        // Stored as 'sol_amount'
  isUsdc: false,                        // Stored as 'is_usdc'
  isPublic: true,                       // Stored as 'is_public'
  startTime: Math.floor(Date.now() / 1000),  // Stored as 'start_time'
  endTime: Math.floor(Date.now() / 1000) + (30 * 86400),  // Stored as 'end_time'
  status: "active",
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

// Automatically saved to:
// - File: .fitwager_data/challenges.json (if Supabase not configured)
// - Database: competitions table (if Supabase configured)
```

### Example 2: List Challenges
```typescript
import { listChallenges } from '@/lib/db/storage';

// Get all public active challenges
const publicChallenges = await listChallenges({
  isPublic: true,
  filter: "active"
});

// Get challenges by creator
const myChallenges = await listChallenges({
  creator: "my_wallet_address"
});

// Results automatically converted from Supabase format to internal format
```

### Example 3: Get Single Challenge
```typescript
import { getChallenge } from '@/lib/db/storage';

const challenge = await getChallenge("challenge_123");
console.log(challenge.title);      // Works! Automatically mapped from 'name'
console.log(challenge.entryFee);   // Works! Automatically mapped from 'sol_amount'
```

### Example 4: Save User OAuth Tokens
```typescript
import { upsertUser } from '@/lib/db/storage';

await upsertUser({
  id: "wallet_address",
  googleEmail: "user@gmail.com",
  googleAccessToken: "access_token_123...",
  googleRefreshToken: "refresh_token_456...",
  googleTokenExpiry: Date.now() + (3600 * 1000), // 1 hour from now
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

// Automatically saved to:
// - users table (if Supabase configured)
// - Memory store (if not configured)
```

---

## 🔧 Configuration

### See Active Storage Mode
Check the console logs when server starts:
- "Loaded X challenges from file" → Using file storage
- "Supabase client initialized" → Using Supabase (if this appears)

### Switch Modes
**To use Supabase:** Add to `client/.env`
```env
SUPABASE_URL=your_url
SUPABASE_SERVICE_KEY=your_secret_key
```
Restart server → Automatic switch to Supabase

**To use file storage:** Remove the above variables
Restart server → Automatic switch to file storage

---

## ✨ What Happens When You Create a Challenge

```
1. User fills form on /challenges/create
   - Name: "10K Steps Daily"
   - Entry Fee: 0.25 SOL
   - Duration: 7 days

2. Form submits to /api/challenges/create
   - Creates on-chain via Anchor program
   - Gets back challengePda

3. API calls storage.upsertChallenge()
   - Converts: title → name, entryFee → sol_amount
   - Saves to Supabase competitions table

4. Challenge appears on /challenges/public
   - Fetches from storage.listChallenges()
   - Converts: name → title, sol_amount → entryFee
   - User sees: "10K Steps Daily" with "◎0.25" entry fee

5. User clicks to join
   - Stores participant record
   - Transfers SOL to contract
   - User's status updated in database
```

---

## 📚 Next Steps

1. **Read**: GET_SUPABASE_KEYS.md (to get your keys)
2. **Read**: SUPABASE_SETUP_GUIDE.md (detailed setup)
3. **Add**: Supabase keys to `.env.local` and `.env`
4. **Test**: Create a challenge and check Supabase
5. **Deploy**: Your app automatically uses Supabase in production

---

## 📱 Files Changed

- `src/lib/db/schema.ts` - Updated documentation
- `src/lib/db/storage.ts` - Added Supabase integration + conversion functions

**New helper functions:**
- `normalizeCompetitionData()` - Converts Supabase → internal format
- `denormalizeCompetitionData()` - Converts internal → Supabase format

These handle all the name mapping automatically.

---

## ❓ FAQ

**Q: Do I need Supabase to run the app?**
A: No! File storage mode works without it. But Supabase is recommended for production.

**Q: What if I add keys later?**
A: Just restart the server - it automatically switches from file to Supabase.

**Q: Can I go back to file storage?**
A: Yes, remove the keys and restart. Data in Supabase stays there though.

**Q: Are my keys visible to users?**
A: Only NEXT_PUBLIC_* keys. SERVICE_KEY must stay secret in .env.

**Q: How do I see my data in Supabase?**
A: Dashboard → Table Editor → Select 'competitions' or 'users' table.

---

Everything is connected and ready to use! 🎉
