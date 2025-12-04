import { 
  Connection, 
  PublicKey, 
  Transaction, 
  TransactionInstruction, 
  Signer,
  TransactionSignature,
  Commitment,
} from "@solana/web3.js";
import BN from "bn.js";

const LAMPORTS_PER_SOL = 1_000_000_000;

/**
 * Convert SOL to lamports
 */
export function solToLamports(sol: number): number {
  return Math.floor(sol * LAMPORTS_PER_SOL);
}

/**
 * Convert lamports to SOL
 */
export function lamportsToSol(lamports: number | BN): number {
  const value = typeof lamports === "number" ? lamports : lamports.toNumber();
  return value / LAMPORTS_PER_SOL;
}

/**
 * Format SOL amount with proper decimals
 */
export function formatSol(lamports: number | BN, decimals: number = 4): string {
  const sol = lamportsToSol(lamports);
  return sol.toFixed(decimals);
}

/**
 * Convert number to BN (BigNumber)
 */
export function toBN(value: number | string): BN {
  return new BN(value);
}

/**
 * Convert BN to number
 */
export function fromBN(bn: BN): number {
  return bn.toNumber();
}

/**
 * Build and send a transaction
 */
export async function buildAndSendTransaction(
  connection: Connection,
  instructions: TransactionInstruction[],
  signers: Signer[],
  payer: PublicKey
): Promise<string> {
  const transaction = new Transaction();

  for (const instruction of instructions) {
    transaction.add(instruction);
  }

  transaction.feePayer = payer;
  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  transaction.sign(...signers);

  const signature = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction(signature, "confirmed");

  return signature;
}

/**
 * Wait for transaction confirmation
 */
export async function waitForConfirmation(
  connection: Connection,
  signature: string,
  timeout: number = 30000
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const status = await connection.getSignatureStatus(signature);
    if (status.value?.confirmationStatus === "confirmed" || status.value?.confirmationStatus === "finalized") {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return false;
}

/**
 * Get account balance in SOL
 */
export async function getBalance(connection: Connection, publicKey: PublicKey): Promise<number> {
  const lamports = await connection.getBalance(publicKey);
  return lamportsToSol(lamports);
}

/**
 * Check if an account exists
 */
export async function accountExists(connection: Connection, publicKey: PublicKey): Promise<boolean> {
  const account = await connection.getAccountInfo(publicKey);
  return account !== null;
}

/**
 * Format a timestamp as a date string
 */
export function formatTimestamp(timestamp: number | BN): string {
  const ts = typeof timestamp === "number" ? timestamp : timestamp.toNumber();
  return new Date(ts * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get time remaining until a timestamp
 */
export function getTimeRemaining(endTimestamp: number | BN): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
  isExpired: boolean;
} {
  const endTs = typeof endTimestamp === "number" ? endTimestamp : endTimestamp.toNumber();
  const now = Math.floor(Date.now() / 1000);
  const diff = endTs - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0, isExpired: true };
  }

  return {
    days: Math.floor(diff / 86400),
    hours: Math.floor((diff % 86400) / 3600),
    minutes: Math.floor((diff % 3600) / 60),
    seconds: diff % 60,
    total: diff,
    isExpired: false,
  };
}

/**
 * Format time remaining as a string
 */
export function formatTimeRemaining(endTimestamp: number | BN): string {
  const { days, hours, minutes, isExpired } = getTimeRemaining(endTimestamp);
  
  if (isExpired) return "Ended";
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Get Solana explorer URL for transaction
 */
export function getExplorerTxUrl(signature: string, cluster: string = "devnet"): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
}

/**
 * Get Solana explorer URL for address
 */
export function getExplorerAddressUrl(address: string | PublicKey, cluster: string = "devnet"): string {
  const addressStr = typeof address === "string" ? address : address.toBase58();
  return `https://explorer.solana.com/address/${addressStr}?cluster=${cluster}`;
}

/**
 * Request airdrop on devnet
 */
export async function requestAirdrop(
  connection: Connection,
  publicKey: PublicKey,
  amount: number = 1
): Promise<TransactionSignature> {
  const signature = await connection.requestAirdrop(
    publicKey,
    amount * LAMPORTS_PER_SOL
  );
  await connection.confirmTransaction(signature, "confirmed");
  return signature;
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, baseDelay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError;
}
