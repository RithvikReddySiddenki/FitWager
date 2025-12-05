# FitWager Blockchain Integration Guide

## Overview
FitWager is now configured to make actual transactions on the Solana blockchain. This guide explains the key components and how to use them.

## Key Components

### 1. **Smart Contract (Rust)**
Located in: `programs/fitwager/src/`

The Solana program handles:
- **createChallenge**: Create a new fitness challenge with SOL or USDC entry fee
- **joinChallengeSol**: Join a challenge by transferring SOL to an escrow vault
- **joinChallengeUsdc**: Join a challenge by transferring USDC tokens
- **submitScore**: Submit workout scores for the challenge
- **endChallengeSol**: End the challenge and pay the winner (SOL)
- **endChallengeUsdc**: End the challenge and pay the winner (USDC)
- **cancelChallenge**: Cancel a challenge and refund participants

### 2. **TypeScript Client**
Located in: `client/src/utils/`

**Key Files:**
- **idl.ts**: Interface Definition Language - Maps TypeScript to Rust program instructions
- **anchorClient.ts**: Anchor program client with transaction builders and signers
- **pda.ts**: Program Derived Address helpers for generating accounts
- **solana.ts**: Utility functions for SOL/lamports conversion
- **constants.ts**: Configuration for network, RPC, and constraints

**Main Functions:**
- `createChallenge()`: Create a new challenge on-chain
- `joinChallenge()`: Join an existing challenge
- `submitScore()`: Submit a workout score
- `endChallenge()`: End challenge and pay winners
- `fetchChallenge()`: Read challenge data from chain
- `fetchParticipants()`: Read participant data

### 3. **Configuration**

Create `.env.local` in the client directory:

```env
# Solana Network Configuration
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com

# Program Configuration
NEXT_PUBLIC_PROGRAM_ID=Fg6PaFpoGXkYsidMpWxqSW1JmAxo9ZPVknpYAH97PvX1

# Optional: Additional configuration
NEXT_PUBLIC_GOOGLE_FIT_CLIENT_ID=your_google_client_id_here
NEXT_PUBLIC_CIRCLE_API_KEY=your_circle_key_here
```

## Transaction Flow

### Creating a Challenge
1. User connects wallet (Phantom, Solflare, Backpack, etc.)
2. User fills challenge details (title, type, goal, stake, duration)
3. Frontend calls `createChallenge()` with wallet context
4. Anchor client builds transaction:
   - Creates Challenge PDA (Program Derived Address)
   - Creates Escrow Vault PDA
   - Calls `createChallenge` instruction
5. Wallet signs transaction
6. Transaction sent to Solana RPC (devnet)
7. Transaction confirmed with "confirmed" commitment
8. Challenge ID returned to user

### Joining a Challenge
1. User navigates to challenge detail page
2. User clicks "Join Challenge" button
3. Frontend calls `joinChallenge()` with wallet context
4. Anchor client builds transaction:
   - Creates Participant PDA
   - Calls `joinChallengeSol` instruction
   - Transfers entry fee SOL to escrow vault
5. Wallet signs transaction
6. Transaction confirmed
7. Participant added to challenge

### Submitting Score
1. User completes workout and submits score
2. Frontend calls `submitScore()` with score value
3. Anchor client builds transaction:
   - Calls `submitScore` instruction
   - Updates participant score on-chain
4. Wallet signs transaction
5. Transaction confirmed
6. Score recorded

### Ending Challenge & Payout
1. Challenge duration ends
2. Creator calls `endChallenge()` with winner public key
3. Anchor client builds transaction:
   - Calls `endChallengeSol` instruction
   - Transfers winner share (95% of pool) to winner
   - Transfers platform fee (5% of pool) to platform wallet
4. Transaction confirmed
5. Funds distributed

## Retry Logic

All transactions use exponential backoff retry logic for robustness:
- Max retries: 3
- Base delay: 1000ms
- Max delay: 10000ms
- Retries on: Network errors, blockhash errors, RPC errors (503, 429)
- Does NOT retry on: User rejection, validation errors, wallet issues

## Error Handling

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| "Wallet not connected" | User hasn't connected wallet | Prompt user to connect wallet |
| "Insufficient SOL balance" | Not enough SOL for transaction | Request airdrop on devnet |
| "Wallet signing timeout" | Wallet app not responding | Ensure wallet app is open |
| "Account not found" | Challenge PDA doesn't exist | Check challenge ID is correct |
| "User rejected" | User declined in wallet | User needs to approve transaction |
| "Challenge has already ended" | Trying to join ended challenge | Filter out ended challenges |

## Testing Checklist

1. **Network Connection**
   - [ ] RPC endpoint is accessible
   - [ ] Cluster matches environment

2. **Wallet Connection**
   - [ ] Wallet adapter properly initialized
   - [ ] Can connect Phantom/Solflare/Backpack
   - [ ] Can sign transactions

3. **Create Challenge**
   - [ ] Transaction built correctly
   - [ ] Signed by creator
   - [ ] Confirmed on-chain
   - [ ] Challenge account created
   - [ ] Vault account created

4. **Join Challenge**
   - [ ] Transaction built correctly
   - [ ] SOL transferred to vault
   - [ ] Participant account created
   - [ ] Score initialized to 0

5. **Submit Score**
   - [ ] Transaction built correctly
   - [ ] Score updated on-chain
   - [ ] Can't submit before joining

6. **End Challenge**
   - [ ] Only creator can end
   - [ ] Payout calculated correctly (95/5 split)
   - [ ] Winner receives SOL
   - [ ] Platform receives fee

## Solana Devnet Airdrop

To test with SOL on devnet:

```bash
# Request airdrop via CLI
solana airdrop 2 <WALLET_ADDRESS> --url https://api.devnet.solana.com

# Or use Solana Faucet: https://faucet.solana.com/
```

## Deployment for Mainnet

When ready to deploy to mainnet:

1. **Update Program ID**: Deploy Rust program to mainnet and update `DEFAULT_PROGRAM_ID_STR` in `constants.ts` and `pda.ts`

2. **Update RPC Endpoint**: Change to mainnet in `.env.local`:
   ```env
   NEXT_PUBLIC_SOLANA_CLUSTER=mainnet
   NEXT_PUBLIC_RPC_ENDPOINT=https://api.mainnet-beta.solana.com
   ```

3. **Security**: 
   - Set platform wallet address securely
   - Review all transaction paths
   - Conduct full security audit
   - Test extensively on devnet first

4. **Wallet Configuration**: Update wallet adapter configuration in `providers.tsx`

## Advanced Configuration

### Custom RPC Endpoint

Use a private RPC for better reliability:

```env
NEXT_PUBLIC_RPC_ENDPOINT=https://your-private-rpc.com
```

### Token Integration (USDC)

For USDC support, you'll need:

1. Token mint address (currently USDC on devnet)
2. Associated token accounts setup
3. Token program integration in Anchor client

The framework is ready; just provide token account addresses.

### Custom Commitment Level

Modify in `anchorClient.ts`:

```typescript
const connection = new Connection(RPC_ENDPOINT, {
  commitment: "confirmed",  // Change to "processed" or "finalized"
  confirmTransactionInitialTimeout: 60000,
});
```

## Monitoring & Analytics

Track transactions:
- Use Solana Explorer: https://explorer.solana.com/
- Set up Helius webhook for real-time notifications
- Monitor gas fees and transaction success rates

## Resources

- **Anchor Book**: https://book.anchor-lang.com/
- **Solana Documentation**: https://docs.solana.com/
- **Wallet Adapter**: https://github.com/anza-xyz/wallet-adapter
- **SPL Token**: https://spl.solana.com/token

## Support

For issues:
1. Check error messages in console
2. Verify environment variables
3. Test with different wallet
4. Check Solana status: https://status.solana.com/
