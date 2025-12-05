# FitWager Database Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FitWager App                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Frontend (React/Next.js)                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ /challenges/create   → Create Challenge Form             │   │
│  │ /challenges/public   → View All Challenges               │   │
│  │ /dashboard          → User Dashboard                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                       │
│                           ↓                                       │
│  Backend API Routes (Next.js)                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ POST /api/challenges/create  ← Create                    │   │
│  │ GET  /api/challenges/list    ← Fetch list                │   │
│  │ POST /api/user/stats         ← Get user data             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                       │
│                           ↓                                       │
│  Storage Layer (Unified Interface)                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ src/lib/db/storage.ts                                    │   │
│  │ ├─ upsertChallenge()                                     │   │
│  │ ├─ listChallenges()                                      │   │
│  │ ├─ getChallenge()                                        │   │
│  │ ├─ upsertUser()                                          │   │
│  │ ├─ getUser()                                             │   │
│  │ └─ Conversion helpers:                                   │   │
│  │    ├─ normalizeCompetitionData()   (DB → Code)           │   │
│  │    └─ denormalizeCompetitionData() (Code → DB)           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                       │
│      ┌────────────────────┼────────────────────┐                │
│      ↓                    ↓                     ↓                │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
      │                    │                     │
      ↓                    ↓                     ↓
   
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Supabase     │   │ File Storage │   │ Memory Store │
│ (Cloud)      │   │ (Local)      │   │ (Runtime)    │
├──────────────┤   ├──────────────┤   ├──────────────┤
│ competitions │   │ challenges.  │   │ challenges   │
│ users        │   │ json         │   │ users        │
│ (optional:)  │   │              │   │ participants │
│ participants │   │              │   │ verifications│
│ verifications│   │              │   │              │
└──────────────┘   └──────────────┘   └──────────────┘
   Online        Persistent Local     Temporary
   Shared        (Survives restart)   (Lost on restart)
```

---

## Data Flow: Creating a Challenge

```
User Interface
    │
    ├─ /challenges/create form
    │  ├─ Title: "10K Steps"
    │  ├─ Entry Fee: 0.25 SOL
    │  ├─ Duration: 7 days
    │  └─ Submit
    │
    ↓
Backend API: POST /api/challenges/create
    │
    ├─ On-Chain Transaction (Solana Blockchain)
    │  ├─ Create challenge PDA
    │  ├─ Initialize escrow vault
    │  └─ Return signature + challengePda
    │
    ├─ Off-Chain Database Save
    │  │
    │  ├─ Prepare data (convert title → name)
    │  │
    │  ↓ Check: SUPABASE_URL + SUPABASE_SERVICE_KEY set?
    │  ├─ YES → Save to Supabase 'competitions' table ✓
    │  │        Data in cloud, shared across servers
    │  │
    │  └─ NO → Save to memory + file storage ✓
    │         Data in .fitwager_data/challenges.json
    │
    ↓
Frontend
    │
    ├─ Transaction Modal: "Challenge Created!"
    ├─ Display explorer link: solscan.io/tx/...
    │
    └─ Redirect to: /challenges/{challengeId}
```

---

## Data Flow: Viewing Challenges

```
User visits: /challenges/public
    │
    ↓
Frontend: fetchChallenges({ isPublic: true })
    │
    ↓
Backend API: GET /api/challenges/list?public=true
    │
    ├─ Check: SUPABASE_URL + SUPABASE_SERVICE_KEY set?
    │
    ├─ YES → Query Supabase
    │  │
    │  ├─ SELECT * FROM competitions
    │  │         WHERE is_public = true
    │  │         ORDER BY created_at DESC
    │  │
    │  └─ Convert each row: name→title, sol_amount→entryFee
    │
    └─ NO → Read from file
       │
       ├─ Load .fitwager_data/challenges.json
       ├─ Filter: isPublic = true
       └─ Sort by createdAt DESC
    │
    ↓
Response: [
  {
    id: "challenge_pda_123",
    title: "10K Steps",           ← From 'name' column
    entryFee: 0.25,               ← From 'sol_amount' column
    description: "Walk daily",
    creator: "wallet123",
    ...
  }
]
    │
    ↓
Display on page:
┌─────────────────────────────┐
│ 👟 10K Steps                 │
│ by wallet...                │
│ Walk daily                   │
├─────────────────────────────┤
│ Entry: ◎0.25                │
│ Pool:  ◎2.50 (10 joined)    │
│ Time:  7d 4h remaining      │
├─────────────────────────────┤
│     [Join for ◎0.25]        │
└─────────────────────────────┘
```

---

## Schema Mapping Details

### Internal Code Format
```typescript
interface ChallengeMetadata {
  id: string;              // Challenge PDA
  title: string;           // "10K Steps"
  description: string;     // "Walk 10,000 steps daily"
  creator: string;         // "wallet123..."
  challengeType: string;   // "steps"
  goal: number;            // 10000
  entryFee: number;        // 0.25 (SOL)
  isUsdc: boolean;         // false
  isPublic: boolean;       // true
  startTime: number;       // Unix timestamp
  endTime: number;         // Unix timestamp
  status: string;          // "active"
  createdAt: number;       // Milliseconds
  updatedAt: number;       // Milliseconds
}
```

### Supabase Database Format
```sql
competitions table:
┌────────────┬──────────────┬────────────────────────────┐
│ Column     │ Type         │ Internal Maps To           │
├────────────┼──────────────┼────────────────────────────┤
│ id         │ text         │ challenge.id               │
│ name       │ text         │ challenge.title ← KEY!     │
│ description│ text         │ challenge.description      │
│ creator    │ text         │ challenge.creator          │
│ challenge  │ text         │ challenge.challengeType    │
│ _type      │              │                            │
│ goal       │ integer      │ challenge.goal             │
│ sol_amount │ decimal      │ challenge.entryFee ← KEY!  │
│ is_usdc    │ boolean      │ challenge.isUsdc           │
│ is_public  │ boolean      │ challenge.isPublic         │
│ start_time │ integer      │ challenge.startTime        │
│ end_time   │ integer      │ challenge.endTime          │
│ duration   │ integer      │ Calculated from times      │
│ _days      │              │                            │
│ status     │ text         │ challenge.status           │
│ created_at │ timestamp    │ challenge.createdAt        │
│ updated_at │ timestamp    │ challenge.updatedAt        │
└────────────┴──────────────┴────────────────────────────┘
```

---

## Storage Decision Logic

```
When upsertChallenge() is called:

1. Check environment: process.env.SUPABASE_URL
2. Check environment: process.env.SUPABASE_SERVICE_KEY

   ┌─────────────────────────────────────────────┐
   │ Both set and valid?                         │
   ├─────────────────────────────────────────────┤
   │                                             │
   ├─ YES ──→ Initialize Supabase client        │
   │          │                                 │
   │          ├─ Convert internal → Supabase   │
   │          │  (title → name, etc)           │
   │          │                                 │
   │          ├─ SQL: UPSERT competitions      │
   │          │                                 │
   │          └─ Data now in cloud ✓           │
   │                                             │
   └─────────────────────────────────────────────┘
   │
   ├─ NO ──→  Use file storage               
   │          │                              
   │          ├─ Save to memory store        
   │          │  (memoryStore.challenges)   
   │          │                              
   │          ├─ Write to disk              
   │          │  (.fitwager_data/           
   │          │   challenges.json)          
   │          │                              
   │          └─ Data persists on disk ✓   
```

---

## File Structure

```
FitWager/
├── client/
│   ├── .env.local                      ← Frontend keys (public)
│   │   ├── NEXT_PUBLIC_SUPABASE_URL
│   │   └── NEXT_PUBLIC_SUPABASE_ANON_KEY
│   │
│   ├── .env                            ← Backend keys (SECRET)
│   │   ├── SUPABASE_URL
│   │   └── SUPABASE_SERVICE_KEY
│   │
│   ├── .fitwager_data/                 ← Local file storage
│   │   └── challenges.json
│   │
│   └── src/lib/db/
│       ├── schema.ts                   ← Type definitions
│       └── storage.ts                  ← Database operations
│           ├── getChallenge()
│           ├── upsertChallenge()
│           ├── listChallenges()
│           ├── getUser()
│           ├── upsertUser()
│           ├── normalizeCompetitionData()
│           └── denormalizeCompetitionData()
```

---

## Configuration Scenarios

### Scenario 1: Development (No Supabase)
```
.env.local: No Supabase keys
.env:       (empty or no SUPABASE_*)

Result:
- Challenges save to .fitwager_data/challenges.json
- Data persists on disk (survives server restart)
- Only single server instance can access
```

### Scenario 2: Production (With Supabase)
```
.env.local: NEXT_PUBLIC_SUPABASE_URL + ANON_KEY
.env:       SUPABASE_URL + SERVICE_KEY

Result:
- Challenges sync to Supabase cloud database
- Data shared across all server instances
- Accessible from anywhere (web, mobile, APIs)
- Automatic backups
```

### Scenario 3: Hybrid (Development + Supabase)
```
.env.local: Has Supabase keys
.env:       Has Supabase keys

Result:
- Uses Supabase for dev and testing
- Same database as production
- Can test with real data
```

---

## Security Model

```
Frontend (Browser)
    ├─ Has access to: NEXT_PUBLIC_* keys (anon key)
    ├─ Can: READ public data, LIMITED WRITE
    └─ Cannot: Access service key, full DB write

Backend (Server)
    ├─ Has access to: SERVICE_KEY (secret)
    ├─ Can: FULL READ/WRITE to database
    └─ Should: Never expose keys to frontend
```

---

## API Response Flow

```
Browser → POST /api/challenges/create
          └─ (headers include auth)
            │
            ↓
Backend Route Handler
├─ Validate request
├─ Call storage.upsertChallenge()
│  ├─ Check SUPABASE_SERVICE_KEY
│  └─ Save data
├─ Return response
            │
            ↓
Browser ← {
            success: true,
            challenge: { /* full data */ },
            error: null
          }
```

---

## Query Examples

### List All Public Challenges (SQL)
```sql
SELECT * FROM competitions
WHERE is_public = true
  AND status = 'active'
ORDER BY created_at DESC;
```

### Find Challenges by Creator (SQL)
```sql
SELECT * FROM competitions
WHERE creator = 'wallet_address'
ORDER BY created_at DESC;
```

### Get User's OAuth Tokens (SQL)
```sql
SELECT googleAccessToken, googleRefreshToken
FROM users
WHERE id = 'wallet_address';
```

### Get User Stats (SQL)
```sql
SELECT 
  COUNT(*) as total_challenges,
  SUM(sol_amount) as total_staked,
  COUNT(CASE WHEN status='active' THEN 1 END) as active_now
FROM competitions
WHERE creator = 'wallet_address';
```

---

## Summary

- **Two storage modes**: File (development) or Supabase (production)
- **Automatic conversion**: Code format ↔ Database format
- **Unified interface**: Same code works with both
- **Easy migration**: Just add environment variables
- **Secure**: Secret keys stay on server, public keys safe in browser

You're all set! 🚀
