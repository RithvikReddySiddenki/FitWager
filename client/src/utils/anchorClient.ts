import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  TransactionSignature,
} from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { IDL, FitWager } from "./idl";
import { getChallengePda, getVaultPda, getParticipantPda } from "./pda";
import { getProgramId } from "./constants";
import { solToLamports } from "./solana";
import { RPC_ENDPOINT } from "./constants";

// ============================================================
// Types
// ============================================================

export interface ChallengeAccount {
  creator: PublicKey;
  entryFee: BN;
  totalPool: BN;
  startTime: BN;
  endTime: BN;
  status: { active: Record<string, never> } | { ended: Record<string, never> };
}

export interface ParticipantAccount {
  player: PublicKey;
  score: BN;
  hasJoined: boolean;
}

export interface CreateChallengeParams {
  entryFeeSol: number;
  durationDays: number;
  challengeType: string; // "steps", "distance", "time", "calories"
  goal: number;
  isPublic: boolean;
}

export interface CreateChallengeResult {
  signature: string;
  challengePda: PublicKey;
  vaultPda: PublicKey;
  timestamp: number;
}

export interface JoinChallengeResult {
  signature: string;
  participantPda: PublicKey;
}

export interface SubmitScoreResult {
  signature: string;
}

export interface EndChallengeResult {
  signature: string;
  winner: PublicKey;
  payout: number;
}

// ============================================================
// Connection Management (Multi-user safe)
// ============================================================

/**
 * Get a fresh connection to the Solana network
 * Each request gets its own connection to avoid conflicts
 */
export function getConnection(): Connection {
  return new Connection(RPC_ENDPOINT, {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 60000,
  });
}

/**
 * Create an Anchor provider from wallet adapter
 * Creates a new provider for each transaction to avoid state conflicts
 */
export function getProvider(wallet: WalletContextState): AnchorProvider | null {
  if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
    console.warn("Wallet missing required properties:", {
      hasPublicKey: !!wallet.publicKey,
      hasSignTransaction: !!wallet.signTransaction,
      hasSignAllTransactions: !!wallet.signAllTransactions,
    });
    return null;
  }

  const connection = getConnection();
  
  // Create a wallet that properly implements the Wallet interface
  const walletAdapter = {
    publicKey: wallet.publicKey,
    signTransaction: async (tx: any) => {
      console.log("Wallet adapter: signing transaction...");
      try {
        const signed = await wallet.signTransaction!(tx);
        console.log("Wallet adapter: transaction signed successfully");
        return signed;
      } catch (error) {
        console.error("Wallet adapter: signing failed", error);
        throw error;
      }
    },
    signAllTransactions: async (txs: any[]) => {
      console.log("Wallet adapter: signing all transactions...");
      try {
        const signed = await wallet.signAllTransactions!(txs);
        console.log("Wallet adapter: all transactions signed successfully");
        return signed;
      } catch (error) {
        console.error("Wallet adapter: signing failed", error);
        throw error;
      }
    },
  };
  
  return new AnchorProvider(
    connection,
    walletAdapter,
    { 
      commitment: "confirmed",
      preflightCommitment: "confirmed",
    }
  );
}

/**
 * Get a fresh program instance for each operation
 */
export function getProgram(provider: AnchorProvider): Program<any> {
  // IDL doesn't strictly match the Anchor TypeScript 'Idl' shape in this workspace
  // (metadata.spec not present). Use a permissive Program<any> to avoid type errors
  // while retaining runtime behavior.
  
  // Validate program ID before creating program instance
  try {
    const programId = getProgramId();
    
    // Additional validation - ensure programId is valid
    if (!programId) {
      throw new Error('Program ID is undefined. Check NEXT_PUBLIC_PROGRAM_ID in .env.local');
    }
    
    console.log('[Anchor] Using program ID:', programId.toBase58());
    return new Program(IDL as any, programId, provider);
  } catch (error) {
    console.error('[Anchor] Invalid program ID:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid program ID: ${errorMessage}. Check NEXT_PUBLIC_PROGRAM_ID in .env.local`);
  }
}

// ============================================================
// Retry Logic for Multi-user Concurrency
// ============================================================

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
};

/**
 * Retry a transaction with exponential backoff
 * Handles network issues and temporary failures in multi-user scenarios
 */
async function retryTransaction<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      const errorMsg = lastError.message || "";
      
      // Don't retry on user rejection or validation errors
      if (
        errorMsg.includes("User rejected") ||
        errorMsg.includes("Wallet not connected") ||
        errorMsg.includes("already") ||
        errorMsg.includes("invalid") ||
        errorMsg.includes("insufficient")
      ) {
        throw lastError;
      }
      
      // Retry on network/blockhash errors
      if (
        errorMsg.includes("blockhash") ||
        errorMsg.includes("timeout") ||
        errorMsg.includes("connection") ||
        errorMsg.includes("503") ||
        errorMsg.includes("429")
      ) {
        const delay = Math.min(
          config.baseDelay * Math.pow(2, attempt),
          config.maxDelay
        );
        console.log(`Retrying transaction in ${delay}ms (attempt ${attempt + 1}/${config.maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      
      // For other errors, throw immediately
      throw lastError;
    }
  }
  
  throw lastError || new Error("Transaction failed after retries");
}

/**
 * Confirm a transaction with timeout
 */
async function confirmTransaction(
  connection: Connection,
  signature: TransactionSignature,
  timeout: number = 60000
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const status = await connection.getSignatureStatus(signature);
    
    if (status.value?.confirmationStatus === "confirmed" || 
        status.value?.confirmationStatus === "finalized") {
      return;
    }
    
    if (status.value?.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
    }
    
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  
  throw new Error("Transaction confirmation timeout");
}

// ============================================================
// Multi-user Safe Challenge Operations
// ============================================================

/**
 * Create a new challenge
 * - Uses timestamp to ensure unique PDA per creation attempt
 * - Retries on network errors
 */
export async function createChallenge(
  wallet: WalletContextState,
  params: CreateChallengeParams
): Promise<CreateChallengeResult> {
  const provider = getProvider(wallet);
  if (!provider || !wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  return retryTransaction(async () => {
    const program: any = getProgram(provider);
    const timestamp = Math.floor(Date.now() / 1000);
    const [challengePda] = getChallengePda(wallet.publicKey!, timestamp);
    const [vaultPda] = getVaultPda(challengePda);

    const entryFeeLamports = new BN(solToLamports(params.entryFeeSol));
    const durationSeconds = new BN(params.durationDays * 24 * 60 * 60);

    // Map UI type strings to enum values
    const challengeTypeMap: Record<string, any> = {
      steps: { steps: {} },
      distance: { distance: {} },
      time: { duration: {} },
      calories: { calories: {} },
    };

    const challengeType = challengeTypeMap[params.challengeType] || { steps: {} };
    const goal = new BN(params.goal);

    console.log("Creating challenge with:", {
      creator: wallet.publicKey!.toBase58(),
      challengePda: challengePda.toBase58(),
      entryFeeLamports: entryFeeLamports.toString(),
      durationSeconds: durationSeconds.toString(),
      challengeType: params.challengeType,
      goal: goal.toString(),
      isPublic: params.isPublic,
    });

    let signature;
    try {
      console.log("Building Anchor program method...");
      const methodBuilder = program.methods
        .createChallenge(
          entryFeeLamports,
          durationSeconds,
          challengeType,
          goal,
          false, // isUsdc - always false for SOL challenges
          params.isPublic
        )
        .accounts({
          creator: wallet.publicKey!,
          challenge: challengePda,
          escrowVault: vaultPda,
          systemProgram: SystemProgram.programId,
          clock: SYSVAR_CLOCK_PUBKEY,
        });

      console.log("Method built. Calling .rpc()...");
      
      // Use Promise.race to timeout faster if the wallet doesn't respond
      signature = await Promise.race([
        (async () => {
          console.log("Requesting wallet signature...");
          const sig = await methodBuilder.rpc();
          console.log("Wallet signed successfully:", sig);
          return sig;
        })(),
        new Promise<never>((_, reject) =>
          setTimeout(() => {
            console.error("RPC call timeout - wallet never responded to signing request");
            reject(new Error("Wallet signing timeout (30s) - check your wallet app and try again"));
          }, 30000)
        ),
      ]);
    } catch (error) {
      console.error("RPC call or wallet signing failed:", error);
      const errorMsg = String(error);
      
      // If it's a timeout, give a user-friendly message
      if (errorMsg.includes("timeout")) {
        throw new Error(
          "Transaction signing timed out. Make sure your wallet app is open and responsive. Try again."
        );
      }
      throw error;
    }

    console.log("Transaction signature:", signature);

    // Wait for confirmation
    await confirmTransaction(provider.connection, signature);

    return {
      signature,
      challengePda,
      vaultPda,
      timestamp,
    };
  });
}

/**
 * Join an existing challenge (SOL or USDC)
 * - Checks if already joined before sending transaction
 * - Uses init_if_needed pattern on chain for safety
 */
export async function joinChallenge(
  wallet: WalletContextState,
  challengePda: PublicKey,
  useUsdc: boolean = false
): Promise<JoinChallengeResult> {
  const provider = getProvider(wallet);
  if (!provider || !wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  // Pre-flight check: verify user hasn't already joined
  const [participantPda] = getParticipantPda(challengePda, wallet.publicKey);
  
  try {
    const program: any = getProgram(provider);
    const existingParticipant = await program.account.participant.fetchNullable(participantPda);
    if (existingParticipant?.hasJoined) {
      throw new Error("You have already joined this challenge");
    }
  } catch (error) {
    // If error is "already joined", rethrow
    if ((error as Error).message?.includes("already joined")) {
      throw error;
    }
    // Otherwise, account doesn't exist which is expected
  }

  return retryTransaction(async () => {
    const program: any = getProgram(provider);
    const [vaultPda] = getVaultPda(challengePda);

    let signature: string;

    if (useUsdc) {
      // Get USDC token account (SPL Token)
      // Note: In production, you would fetch the actual token account address
      const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJsyFbPVwwQQfFgMoon2tam2gH5Z");
      
      // This is a placeholder - in production, fetch actual token accounts
      // For now, we'll skip USDC for this update
      throw new Error("USDC support needs additional token account setup");
    } else {
      // SOL path
      signature = await program.methods
        .joinChallengeSol()
        .accounts({
          player: wallet.publicKey!,
          challenge: challengePda,
          participant: participantPda,
          escrowVault: vaultPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    }

    await confirmTransaction(provider.connection, signature);

    return {
      signature,
      participantPda,
    };
  });
}

/**
 * Submit a workout score
 * - Verifies challenge is still active
 * - Verifies user has joined
 */
export async function submitScore(
  wallet: WalletContextState,
  challengePda: PublicKey,
  score: number
): Promise<SubmitScoreResult> {
  const provider = getProvider(wallet);
  if (!provider || !wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  // Pre-flight checks
  const program: any = getProgram(provider);
  
  // Check challenge status
  const challenge = await program.account.challenge.fetch(challengePda);
  if ("ended" in challenge.status) {
    throw new Error("Challenge has already ended");
  }
  
  const now = Math.floor(Date.now() / 1000);
  if (challenge.endTime.toNumber() < now) {
    throw new Error("Challenge time has expired");
  }

  // Check if user has joined
  const [participantPda] = getParticipantPda(challengePda, wallet.publicKey);
  const participant = await program.account.participant.fetchNullable(participantPda);
  if (!participant?.hasJoined) {
    throw new Error("You must join the challenge before submitting a score");
  }

  return retryTransaction(async () => {
    const freshProgram: any = getProgram(provider);

    const signature = await freshProgram.methods
      .submitScore(new BN(score))
      .accounts({
        challenge: challengePda,
        participant: participantPda,
      })
      .rpc();

    await confirmTransaction(provider.connection, signature);

    return { signature };
  });
}

/**
 * End a challenge and pay the winner (SOL or USDC)
 * - Verifies caller is creator
 * - Verifies challenge time has passed
 * - Verifies challenge hasn't already ended
 */
export async function endChallenge(
  wallet: WalletContextState,
  challengePda: PublicKey,
  winnerPubkey: PublicKey,
  platformWallet?: PublicKey
): Promise<EndChallengeResult> {
  const provider = getProvider(wallet);
  if (!provider || !wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  // Pre-flight checks
  const program: any = getProgram(provider);
  const challenge = await program.account.challenge.fetch(challengePda);
  
  // Verify creator
  if (!challenge.creator.equals(wallet.publicKey)) {
    throw new Error("Only the creator can end the challenge");
  }
  
  // Verify not already ended
  if ("ended" in challenge.status) {
    throw new Error("Challenge has already ended");
  }
  
  // Verify time has passed (optional - smart contract enforces this)
  const now = Math.floor(Date.now() / 1000);
  if (challenge.endTime.toNumber() > now) {
    throw new Error("Challenge has not ended yet");
  }

  const payout = challenge.totalPool.toNumber();
  const [vaultPda, vaultBump] = getVaultPda(challengePda);

  return retryTransaction(async () => {
    const freshProgram: any = getProgram(provider);

    let signature: string;

    // Use default platform wallet if not provided
    const platformAddr = platformWallet || wallet.publicKey!;

    if (challenge.is_usdc) {
      // USDC path
      // Note: In production, you would fetch actual token accounts
      throw new Error("USDC payouts need additional token account setup");
    } else {
      // SOL path
      signature = await freshProgram.methods
        .endChallengeSol(vaultBump)
        .accounts({
          creator: wallet.publicKey!,
          challenge: challengePda,
          escrowVault: vaultPda,
          winner: winnerPubkey,
          platformWallet: platformAddr,
          systemProgram: SystemProgram.programId,
          clock: SYSVAR_CLOCK_PUBKEY,
        })
        .rpc();
    }

    await confirmTransaction(provider.connection, signature);

    return {
      signature,
      winner: winnerPubkey,
      payout,
    };
  });
}

// ============================================================
// Read Operations (Multi-user safe - stateless)
// ============================================================

/**
 * Fetch a challenge account
 * Creates fresh connection for each read
 */
export async function fetchChallenge(
  challengePda: PublicKey
): Promise<ChallengeAccount | null> {
  try {
    const connection = getConnection();
    const provider = new AnchorProvider(
      connection,
      {} as never,
      { commitment: "confirmed" }
    );
    const program: any = new Program(IDL as any, provider);
    
    const account = await program.account.challenge.fetch(challengePda);
    return account as unknown as ChallengeAccount;
  } catch (error) {
    console.error("Error fetching challenge:", error);
    return null;
  }
}

/**
 * Fetch a participant account
 */
export async function fetchParticipant(
  challengePda: PublicKey,
  playerPubkey: PublicKey
): Promise<ParticipantAccount | null> {
  try {
    const connection = getConnection();
    const provider = new AnchorProvider(
      connection,
      {} as never,
      { commitment: "confirmed" }
    );
    const program: any = new Program(IDL as any, provider);
    
    const [participantPda] = getParticipantPda(challengePda, playerPubkey);
    const account = await program.account.participant.fetch(participantPda);
    return account as unknown as ParticipantAccount;
  } catch {
    return null;
  }
}

/**
 * Fetch all challenges
 */
export async function fetchAllChallenges(): Promise<
  Array<{ pubkey: PublicKey; account: ChallengeAccount }>
> {
  try {
    const connection = getConnection();
    const provider = new AnchorProvider(
      connection,
      {} as never,
      { commitment: "confirmed" }
    );
    const program: any = new Program(IDL as any, provider);
    
    const accounts = await program.account.challenge.all();
    return accounts.map((a: any) => ({
      pubkey: a.publicKey,
      account: a.account as unknown as ChallengeAccount,
    }));
  } catch (error) {
    console.error("Error fetching challenges:", error);
    return [];
  }
}

/**
 * Fetch all participants for a challenge
 */
export async function fetchChallengeParticipants(
  challengePda: PublicKey
): Promise<Array<{ pubkey: PublicKey; account: ParticipantAccount }>> {
  try {
    const connection = getConnection();
    const provider = new AnchorProvider(
      connection,
      {} as never,
      { commitment: "confirmed" }
    );
    const program: any = new Program(IDL as any, provider);
    
    // Get all participant accounts and filter by challenge
    const allParticipants = await program.account.participant.all();
    const challengeParticipants: Array<{ pubkey: PublicKey; account: ParticipantAccount }> = [];
    
    for (const p of allParticipants) {
      const playerPubkey = p.account.player;
      const [expectedPda] = getParticipantPda(challengePda, playerPubkey);
      
      if (expectedPda.equals(p.publicKey) && p.account.hasJoined) {
        challengeParticipants.push({
          pubkey: p.publicKey,
          account: p.account as unknown as ParticipantAccount,
        });
      }
    }
    
    return challengeParticipants;
  } catch (error) {
    console.error("Error fetching participants:", error);
    return [];
  }
}

/**
 * Check if a user has joined a challenge
 */
export async function hasUserJoined(
  challengePda: PublicKey,
  userPubkey: PublicKey
): Promise<boolean> {
  try {
    const participant = await fetchParticipant(challengePda, userPubkey);
    return participant?.hasJoined ?? false;
  } catch {
    return false;
  }
}

// ============================================================
// Utility Functions
// ============================================================

export function isChallengeActive(challenge: ChallengeAccount): boolean {
  return "active" in challenge.status;
}

export function isChallengeEnded(challenge: ChallengeAccount): boolean {
  return "ended" in challenge.status;
}

export function getExplorerUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

export function formatAnchorError(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const errorMessage = (error as { message: string }).message;
    
    // Extract custom error message if available
    const match = errorMessage.match(/Error Message: (.+)/);
    if (match) {
      return match[1];
    }
    
    // Handle common errors with user-friendly messages
    if (errorMessage.includes("insufficient funds")) {
      return "Insufficient SOL balance for this transaction";
    }
    if (errorMessage.includes("Wallet not connected")) {
      return "Please connect your wallet first";
    }
    if (errorMessage.includes("User rejected")) {
      return "Transaction was cancelled";
    }
    if (errorMessage.includes("already joined")) {
      return "You have already joined this challenge";
    }
    if (errorMessage.includes("already ended")) {
      return "This challenge has already ended";
    }
    if (errorMessage.includes("not over yet")) {
      return "Challenge has not ended yet";
    }
    if (errorMessage.includes("timeout")) {
      return "Transaction timed out. Please try again.";
    }
    if (errorMessage.includes("blockhash")) {
      return "Network congestion. Please try again.";
    }
    if (errorMessage.includes("Account not found")) {
      return "Challenge not found on blockchain";
    }
    
    return errorMessage;
  }
  return "An unknown error occurred";
}
