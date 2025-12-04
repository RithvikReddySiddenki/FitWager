# FitWager Implementation Guide

## Overview

FitWager is a fully on-chain fitness competition platform built on Solana. Users create challenges, stake SOL, and compete based on verified workout data. Winners receive payouts automatically via smart contracts.

## Architecture

### Frontend Stack
- **Next.js 16** (App Router)
- **React 19** with TypeScript
- **Tailwind CSS v4** (Neon Solana UI theme)
- **Zustand** for state management
- **Solana Web3.js** for blockchain interactions
- **Anchor** for smart contract client generation

### Backend Stack
- **Next.js API Routes** (serverless)
- **Solana Web3.js** for on-chain data
- **Anchor Program** for smart contract interactions

### Smart Contract
- **Anchor Framework** (Rust)
- **Program ID**: `Fg6PaFpoGXkYsidMpWxqSW1JmAxo9ZPVknpYAH97PvX1`
- **Network**: Solana Devnet

## Project Structure

```
FitWager/
├── client/                          # Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/                # API routes
│   │   │   │   ├── challenges/
│   │   │   │   │   ├── create/route.ts
│   │   │   │   │   ├── join/route.ts
│   │   │   │   │   ├── submit/route.ts
│   │   │   │   │   ├── end/route.ts
│   │   │   │   │   └── list/route.ts
│   │   │   │   └── user/
│   │   │   │       └── stats/route.ts
│   │   │   ├── challenges/
│   │   │   │   ├── page.tsx         # Challenges hub
│   │   │   │   ├── create/page.tsx  # Create challenge form
│   │   │   │   └── public/page.tsx  # Public challenges browser
│   │   │   ├── dashboard/page.tsx   # User dashboard
│   │   │   ├── [id]/page.tsx        # Challenge details
│   │   │   ├── layout.tsx
│   │   │   ├── providers.tsx
│   │   │   └── page.tsx             # Landing page
│   │   ├── components/
│   │   │   ├── ConnectWalletButton.tsx
│   │   │   ├── WalletConnectionProvider.tsx
│   │   │   ├── ToastContainer.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── TransactionModal.tsx
│   │   └── utils/
│   │       ├── solana.ts            # Solana utilities
│   │       ├── pda.ts               # PDA helpers
│   │       ├── anchorClient.ts      # Anchor client
│   │       └── store.ts             # Zustand store
│   └── package.json
└── programs/
    └── fitwager/
        └── src/
            ├── lib.rs               # Main program
            ├── instructions/
            ├── state/
            └── errors.rs
```

## Key Features

### 1. Challenge Creation
- Users create fitness challenges with:
  - Title and description
  - Entry fee (in SOL)
  - Duration (7, 14, or 30 days)
  - Challenge type (steps, distance, time)
  - Public/private visibility
- Entry fee is held in escrow vault PDA
- Challenge PDA created with seeds: `[b"challenge", creator_key, timestamp]`

### 2. Challenge Joining
- Users join challenges by staking the entry fee
- Participant PDA created: `[b"participant", challenge_key, player_key]`
- SOL transferred to vault PDA
- Participant score initialized to 0

### 3. Score Submission
- Users submit workout scores during active challenge
- Scores validated (must be non-negative)
- Submission only allowed before challenge end time
- Mock verification (ready for Strava/Google Fit integration)

### 4. Challenge Completion & Payouts
- Challenge creator can end challenge after end time
- Winner determined by highest score
- Vault PDA signs transaction (via bump seed)
- Winner receives entire prize pool
- Challenge status updated to "Ended"

### 5. Public Challenges
- Browse all public challenges
- Sort by entry fee, prize pool, or participant count
- View time remaining and participant info
- One-click join functionality

### 6. User Dashboard
- Real-time stats:
  - Total challenges created
  - Total challenges joined
  - Total wins
  - Total SOL earned
  - Win rate percentage
  - Active challenges count
- Wallet connection display
- Quick links to create or join challenges

## API Routes

### POST /api/challenges/create
Create a new challenge
```json
{
  "creator": "wallet_address",
  "entryFee": 0.25,
  "durationDays": 7,
  "title": "10k Steps Daily",
  "description": "steps challenge",
  "isPublic": true
}
```

### POST /api/challenges/join
Join an existing challenge
```json
{
  "player": "wallet_address",
  "challengePda": "challenge_pda_address"
}
```

### POST /api/challenges/submit
Submit workout score
```json
{
  "player": "wallet_address",
  "challengePda": "challenge_pda_address",
  "score": 12500,
  "workoutData": {
    "steps": 12500,
    "distance": 10.5,
    "duration": 45
  }
}
```

### POST /api/challenges/end
End challenge and distribute payouts
```json
{
  "creator": "wallet_address",
  "challengePda": "challenge_pda_address",
  "winner": "winner_wallet_address"
}
```

### GET /api/challenges/list
List challenges with filters
```
?filter=active|ended|all
?public=true|false
```

### GET /api/user/stats
Get user statistics
```
?wallet=wallet_address
```

## State Management (Zustand Store)

The `useFitWagerStore` hook provides:

```typescript
// Challenges
challenges: Challenge[]
setChallenges(challenges)
addChallenge(challenge)

// User stats
userStats: UserStats | null
setUserStats(stats)

// Loading states
isLoading: boolean
setIsLoading(loading)

// Notifications
toasts: Toast[]
addToast(message, type, duration?)
removeToast(id)

// Transactions
txInProgress: boolean
setTxInProgress(inProgress)
lastTxSignature: string | null
setLastTxSignature(signature)

// Async actions
createChallenge(data)
```

## UI Components

### ToastContainer
- Auto-dismissing notifications
- Success, error, warning, info types
- Positioned bottom-right
- Neon Solana styling

### LoadingSpinner
- Animated spinner
- Used in buttons and overlays
- Purple neon gradient

### LoadingOverlay
- Full-screen overlay
- Used during transaction processing
- Backdrop blur effect

### TransactionModal
- Shows transaction status
- Links to Solana Explorer
- Auto-closes on success after 4 seconds

## Utility Functions

### solana.ts
- `solToLamports(sol)` - Convert SOL to lamports
- `lamportsToSol(lamports)` - Convert lamports to SOL
- `toBN(value)` - Convert to BigNumber
- `fromBN(bn)` - Convert from BigNumber
- `buildAndSendTransaction()` - Build and send transaction
- `waitForConfirmation()` - Wait for tx confirmation

### pda.ts
- `getChallengePda(creator, timestamp)` - Get challenge PDA
- `getVaultPda(challengePk)` - Get vault PDA
- `getParticipantPda(challengePk, playerPk)` - Get participant PDA
- `getProgramId()` - Get program ID

### anchorClient.ts
- `getAnchorProgram()` - Get or create program instance
- `clearAnchorCache()` - Clear cached program
- `getProvider()` - Get Anchor provider

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn
- Solana CLI (optional, for local testing)
- Phantom or Solflare wallet

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/FitWager.git
cd FitWager/client
```

2. **Install dependencies**
```bash
npm install
```

3. **Run development server**
```bash
npm run dev
```

4. **Open browser**
```
http://localhost:3000
```

### Environment Variables
Create `.env.local` in `client/` directory:
```
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_PROGRAM_ID=Fg6PaFpoGXkYsidMpWxqSW1JmAxo9ZPVknpYAH97PvX1
```

## Workflow

### Creating a Challenge
1. User connects wallet
2. Fills out challenge form (title, type, goal, stake, duration)
3. Clicks "Create Challenge"
4. Frontend calls `/api/challenges/create`
5. API calculates PDAs and returns challenge details
6. Toast notification shows success
7. User redirected to dashboard

### Joining a Challenge
1. User browses public challenges
2. Clicks "Join Challenge" on a challenge card
3. Frontend calls `/api/challenges/join`
4. API calculates participant PDA
5. SOL transferred from user wallet to vault
6. Participant account created on-chain
7. Toast notification confirms join

### Submitting Score
1. User on active challenge detail page
2. Clicks "Submit Workout"
3. Enters workout data (steps, distance, etc.)
4. Frontend calls `/api/challenges/submit`
5. Score validated and submitted on-chain
6. Toast notification confirms submission

### Ending Challenge
1. Challenge creator waits for end time
2. Clicks "End Challenge" button
3. Frontend calls `/api/challenges/end`
4. Winner determined (highest score)
5. Vault PDA signs payout transaction
6. SOL transferred to winner
7. Challenge status updated to "Ended"

## Security Considerations

1. **Wallet Verification**: All transactions signed by user's wallet
2. **PDA Authority**: Vault PDA can only transfer funds via signed instruction
3. **Input Validation**: All API inputs validated before processing
4. **Error Handling**: Comprehensive error messages for debugging
5. **Rate Limiting**: Consider adding rate limiting to API routes in production

## Future Enhancements

1. **Strava Integration**: Verify workouts via Strava API
2. **Google Fit Integration**: Support Google Fit data
3. **Leaderboards**: Real-time leaderboard updates
4. **Multiplayer Payouts**: Split prize pool among top performers
5. **Challenge Templates**: Pre-built challenge types
6. **Social Features**: Share challenges, invite friends
7. **Mobile App**: React Native version
8. **Governance**: DAO for platform decisions

## Troubleshooting

### Wallet Connection Issues
- Ensure wallet extension is installed
- Check network is set to Devnet
- Try refreshing page

### Transaction Failures
- Check wallet has sufficient SOL
- Verify program ID is correct
- Check PDA seeds match contract

### API Errors
- Check browser console for error messages
- Verify wallet address format
- Ensure API route exists

## Support

For issues or questions:
1. Check this guide first
2. Review error messages in console
3. Check Solana Explorer for transaction details
4. Open an issue on GitHub

## License

MIT License - See LICENSE file for details
