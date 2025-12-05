# Transaction Setup Guide

## ✅ Current Status: Transactions Should Work, But...

Your code **is set up for transactions**, but the "Non-base58 character" error suggests a configuration or validation issue.

## What's Required for Transactions

### 1. ✅ Wallet Connection
- **Status**: ✅ Implemented
- **Location**: `WalletConnectionProvider` in `components/WalletConnectionProvider.tsx`
- **Required**: User must connect their wallet (Phantom, Solflare, etc.)

### 2. ✅ Program ID
- **Status**: ⚠️ Needs Verification
- **Current**: `Fg6PaFpoGXkYsidMpWxqSW1JmAxo9ZPVknpYAH97PvX1`
- **Location**: `client/src/utils/constants.ts`
- **Required**: Must match your deployed Solana program

**Check your `.env.local`:**
```env
NEXT_PUBLIC_PROGRAM_ID=Fg6PaFpoGXkYsidMpWxqSW1JmAxo9ZPVknpYAH97PvX1
```

### 3. ✅ RPC Endpoint
- **Status**: ✅ Configured
- **Current**: Devnet by default
- **Location**: `client/src/utils/constants.ts`
- **Required**: Valid Solana RPC endpoint

**Check your `.env.local`:**
```env
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com/
```

### 4. ✅ Anchor Program Setup
- **Status**: ✅ Implemented
- **Location**: `client/src/utils/anchorClient.ts`
- **Required**: IDL file must match deployed program

### 5. ⚠️ Program Deployment
- **Status**: ❓ Unknown
- **Required**: Your Solana program must be deployed to the network
- **Check**: Is `Fg6PaFpoGXkYsidMpWxqSW1JmAxo9ZPVknpYAH97PvX1` actually deployed?

## Common Causes of "Non-base58 character" Error

### 1. Invalid Program ID
**Problem**: Program ID contains invalid characters or is not a valid Base58 string.

**Solution**: Verify your program ID:
```bash
# Check if program ID is valid
solana address -k your-keypair.json
```

**Fix**: Update `.env.local`:
```env
NEXT_PUBLIC_PROGRAM_ID=YourActualProgramID
```

### 2. Undefined/Null Wallet Address
**Problem**: `wallet.publicKey` is undefined when creating transaction.

**Solution**: Add validation in `store.ts`:
```typescript
if (!wallet.publicKey) {
  throw new Error("Wallet not connected");
}
```

### 3. Invalid Challenge PDA
**Problem**: Challenge PDA calculation fails due to invalid inputs.

**Solution**: The PDA calculation should be safe, but verify:
- `wallet.publicKey` is valid
- `timestamp` is a valid number

### 4. Environment Variable Issues
**Problem**: `NEXT_PUBLIC_PROGRAM_ID` is not set or has invalid characters.

**Solution**: Check `.env.local`:
```env
# Must be a valid Base58 string (44 characters)
NEXT_PUBLIC_PROGRAM_ID=Fg6PaFpoGXkYsidMpWxqSW1JmAxo9ZPVknpYAH97PvX1
```

## How to Debug

### Step 1: Check Console Logs
Look for these logs when creating a challenge:
```
Creating challenge with: {
  creator: "...",  // Should be a valid Base58 address
  challengePda: "...",  // Should be a valid Base58 address
  ...
}
```

### Step 2: Validate Program ID
```typescript
// Add this to your code temporarily
import { PublicKey } from "@solana/web3.js";
try {
  const programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || "Fg6PaFpoGXkYsidMpWxqSW1JmAxo9ZPVknpYAH97PvX1");
  console.log("Program ID is valid:", programId.toBase58());
} catch (error) {
  console.error("Program ID is invalid:", error);
}
```

### Step 3: Check Wallet Connection
```typescript
console.log("Wallet state:", {
  connected: wallet.connected,
  publicKey: wallet.publicKey?.toBase58(),
  hasSignTransaction: !!wallet.signTransaction,
});
```

### Step 4: Verify Program Deployment
```bash
# Check if program exists on devnet
solana program show Fg6PaFpoGXkYsidMpWxqSW1JmAxo9ZPVknpYAH97PvX1 --url devnet
```

## What's Missing?

### If Program Not Deployed:
1. **Deploy your program**:
   ```bash
   cd programs/fitwager
   anchor build
   anchor deploy --provider.cluster devnet
   ```

2. **Update program ID** in `.env.local` with the deployed program ID

### If Program ID Mismatch:
1. Get your actual deployed program ID
2. Update `NEXT_PUBLIC_PROGRAM_ID` in `.env.local`
3. Restart dev server

### If RPC Issues:
1. Use a reliable RPC endpoint (Helius, QuickNode, etc.)
2. Update `NEXT_PUBLIC_RPC_ENDPOINT` in `.env.local`

## Quick Fix Checklist

- [ ] Wallet is connected (check UI)
- [ ] `NEXT_PUBLIC_PROGRAM_ID` is set in `.env.local`
- [ ] `NEXT_PUBLIC_RPC_ENDPOINT` is set in `.env.local`
- [ ] Program is deployed to the network
- [ ] Program ID matches deployed program
- [ ] RPC endpoint is accessible
- [ ] Wallet has SOL for transaction fees (devnet SOL is free)

## Testing Transactions

### Test Free Challenge (No Transaction):
1. Create challenge with 0 SOL entry fee
2. Should work without blockchain transaction
3. Saves to database only

### Test Paid Challenge (Requires Transaction):
1. Create challenge with > 0 SOL entry fee
2. Requires wallet connection
3. Requires program deployment
4. Requires valid RPC endpoint
5. Requires SOL for fees

## Summary

**Transactions CAN work** with your current code, but you need:

1. ✅ **Wallet connected** - User must connect wallet
2. ✅ **Valid program ID** - Must match deployed program
3. ✅ **Program deployed** - Program must exist on network
4. ✅ **Valid RPC endpoint** - Must be accessible
5. ✅ **SOL for fees** - Wallet needs SOL (devnet SOL is free)

The "Non-base58 character" error is likely due to:
- Invalid program ID in environment variable
- Program not deployed
- Program ID mismatch

**Next Steps:**
1. Verify your program is deployed
2. Check `.env.local` has correct `NEXT_PUBLIC_PROGRAM_ID`
3. Test with a free challenge first (0 SOL)
4. Then test with a paid challenge
