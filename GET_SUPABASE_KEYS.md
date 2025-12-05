# Step-by-Step: Get Your Supabase Keys

## Where to Find Your Keys

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com
2. Click "Dashboard" or sign in
3. Select your project "AlwaysDanielG's Project"

### Step 2: Navigate to API Settings
1. Click the **Settings icon** (⚙️) in the left sidebar
2. Click **API** under "Configuration"

### Step 3: Copy Your Keys

You'll see three keys. Copy these two:

#### Frontend Key (.env.local)
Under "Project API keys" section:

**NEXT_PUBLIC_SUPABASE_URL:**
```
https://your-project.supabase.co
```
- This is your "Project URL"
- It's public, safe to expose in frontend

**NEXT_PUBLIC_SUPABASE_ANON_KEY:**
```
Copy the "anon public" key (starts with eyJ...)
```
- This is the "anon public" key
- It's public, safe to expose in frontend

#### Backend Key (.env) ⚠️ KEEP SECRET
Under "Project API keys" section:

**SUPABASE_SERVICE_KEY:**
```
Copy the "service_role" key (starts with eyJ...)
```
- ⚠️ **KEEP THIS SECRET** - Never commit to git or expose
- Only use in backend/server code
- Has full database access

---

## Update Your Files

### 1. Frontend Configuration (.env.local)

Edit: `client/.env.local`

Add or update these lines:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Keep your existing config
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=Fg6PaFpoGXkYsidMpWxqSW1JmAxo9ZPVknpYAH97PvX1
```

### 2. Backend Configuration (.env)

Create: `client/.env`

Add these lines:
```env
# Supabase Backend (Server-side only)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Add other backend config
NODE_ENV=development
```

---

## Example Configuration

### Before (File Storage Mode)
```env
# .env.local - Only frontend keys
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=Fg6PaFpoGXkYsidMpWxqSW1JmAxo9ZPVknpYAH97PvX1
```
→ Challenges save to `.fitwager_data/challenges.json`

### After (Supabase Mode)
```env
# .env.local
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=Fg6PaFpoGXkYsidMpWxqSW1JmAxo9ZPVknpYAH97PvX1
NEXT_PUBLIC_SUPABASE_URL=https://zuqexmokxcvznzgbwvdw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```env
# .env
SUPABASE_URL=https://zuqexmokxcvznzgbwvdw.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
→ Challenges sync to Supabase `competitions` table

---

## Verify It Works

### Step 1: Restart Dev Server
```bash
cd client
npm run dev
```

### Step 2: Create a Challenge
1. Go to http://localhost:3000/challenges/create
2. Create a test challenge
3. Click "Create Challenge"

### Step 3: Check Supabase

Option A - Via Dashboard:
1. Go to Supabase Dashboard
2. Click **Table Editor** (left sidebar)
3. Select **competitions** table
4. Your challenge should appear!

Option B - Via SQL Query:
1. Click **SQL Editor** (left sidebar)
2. Run: `SELECT * FROM competitions;`
3. You should see your challenge

Option C - Check Frontend:
1. Go to http://localhost:3000/challenges/public
2. Your challenge should be displayed!

---

## Security Notes

### .env.local (Public - Safe to Share)
- Contains NEXT_PUBLIC_* variables
- These ARE exposed in frontend code
- Safe because they're limited access keys

### .env (Private - Keep Secret)
- Contains backend secrets
- NEVER commit to git
- Add to .gitignore if not already there

### .gitignore
Make sure your `.env` file is ignored:
```
.env
.env.local
.env.*.local
```

---

## Troubleshooting

### "Invalid API key"
- Copy the correct key (not anon for backend, not service for frontend)
- Check for extra spaces or missing characters

### "Supabase client not available"
- Make sure .env file has SUPABASE_URL and SUPABASE_SERVICE_KEY
- Restart npm dev server after adding .env file

### "Table 'competitions' not found"
- Create the table in Supabase first
- Use the schema in SUPABASE_SETUP_GUIDE.md

### Keys don't look right
- They should start with "eyJ" or be a long URL
- Check you're copying from the right place in Dashboard

---

## What Each Key Does

| Key | Type | Used In | Access Level |
|-----|------|---------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Browser | Database URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Browser | Limited read access |
| `SUPABASE_SERVICE_KEY` | Secret | Server | Full admin access |

---

## Next Steps

1. ✅ Copy your keys from Supabase Dashboard
2. ✅ Add to .env.local and .env files
3. ✅ Restart dev server
4. ✅ Create a test challenge
5. ✅ Verify it appears in Supabase table
6. ✅ Verify it appears on /challenges/public

You're all set! Your app now uses Supabase for persistent cloud storage.
