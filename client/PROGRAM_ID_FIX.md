# Program ID Error Fix

## Error: "Cannot read properties of undefined (reading 'size')"

This error occurs when `NEXT_PUBLIC_PROGRAM_ID` is not set in your `.env.local` file.

## Quick Fix

### Step 1: Create/Update `.env.local`

Create or update `client/.env.local` with:

```env
# Solana Program ID (Required for blockchain transactions)
NEXT_PUBLIC_PROGRAM_ID=Fg6PaFpoGXkYsidMpWxqSW1JmAxo9ZPVknpYAH97PvX1

# Solana Network
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com

# Firebase (if using)
USE_FIREBASE=true
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCPdjnq5h8job2AmYjmvMHiGwC-ewImieg
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=fitwager-ceebf.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=fitwager-ceebf
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=fitwager-ceebf.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=320474898400
NEXT_PUBLIC_FIREBASE_APP_ID=1:320474898400:web:640a5320abf6d45d141585
```

### Step 2: Restart Dev Server

**Important**: Next.js only loads environment variables on startup!

```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd client
npm run dev
```

### Step 3: Verify

1. Check console logs - you should see:
   ```
   [Anchor] Using program ID: Fg6PaFpoGXkYsidMpWxqSW1JmAxo9ZPVknpYAH97PvX1
   ```

2. Try creating a challenge - should work now!

## Why This Happens

- `NEXT_PUBLIC_PROGRAM_ID` is required for Solana blockchain transactions
- Without it, the app can't create the Anchor Program instance
- The error "reading 'size'" happens when trying to create a PublicKey from undefined

## For Free Challenges (0 SOL)

Free challenges don't require the program ID because they skip blockchain transactions. But if you want to create paid challenges (> 0 SOL), you need:

1. ✅ Program ID set in `.env.local`
2. ✅ Program deployed to Solana network
3. ✅ Valid RPC endpoint

## Troubleshooting

### Still getting error after adding to `.env.local`?

1. **Check file location**: Must be `client/.env.local` (not root)
2. **Check file name**: Must be exactly `.env.local` (not `.env.local.txt`)
3. **Restart server**: Environment variables only load on startup
4. **Check format**: No quotes around values, no spaces around `=`

### Program ID format

- Should be 32-44 characters
- Base58 encoded (alphanumeric, no 0, O, I, l)
- Example: `Fg6PaFpoGXkYsidMpWxqSW1JmAxo9ZPVknpYAH97PvX1`

### Testing without Program ID

You can still use the app for:
- ✅ Creating free challenges (0 SOL)
- ✅ Viewing challenges
- ✅ Using Firebase/Supabase database

But you **cannot**:
- ❌ Create paid challenges (> 0 SOL)
- ❌ Join challenges with entry fees
- ❌ Submit scores to blockchain

## Summary

**Add `NEXT_PUBLIC_PROGRAM_ID` to `.env.local` and restart your server!**

The default program ID is already in the code, but it's better to set it explicitly in `.env.local` for clarity.
