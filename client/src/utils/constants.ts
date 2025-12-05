import { PublicKey } from "@solana/web3.js";

// Default program ID (replace with your deployed program ID)
const DEFAULT_PROGRAM_ID_STR = "Fg6PaFpoGXkYsidMpWxqSW1JmAxo9ZPVknpYAH97PvX1";

/**
 * Get program ID - lazy loaded to avoid server-side initialization issues
 */
export function getProgramId(): PublicKey {
  const programIdStr = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_PROGRAM_ID 
    ? process.env.NEXT_PUBLIC_PROGRAM_ID 
    : DEFAULT_PROGRAM_ID_STR;
  return new PublicKey(programIdStr);
}

// Legacy export for compatibility
export const PROGRAM_ID = new PublicKey(DEFAULT_PROGRAM_ID_STR);

// RPC Endpoints
export const RPC_ENDPOINTS = {
  devnet: "https://api.devnet.solana.com",
  testnet: "https://api.testnet.solana.com",
  mainnet: "https://api.mainnet-beta.solana.com",
} as const;

// Supported networks (for wallet switching)
export const SUPPORTED_NETWORKS = ['devnet', 'testnet', 'mainnet'] as const;

// Current cluster
export const CLUSTER = (
  typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SOLANA_CLUSTER 
    ? process.env.NEXT_PUBLIC_SOLANA_CLUSTER 
    : "devnet"
) as keyof typeof RPC_ENDPOINTS;

// Active RPC endpoint
export const RPC_ENDPOINT = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_RPC_ENDPOINT
  ? process.env.NEXT_PUBLIC_RPC_ENDPOINT
  : RPC_ENDPOINTS.devnet;

// Explorer URLs
export const EXPLORER_BASE_URL = "https://explorer.solana.com";

export function getExplorerUrl(type: "tx" | "address", value: string): string {
  const clusterParam = CLUSTER === "mainnet" ? "" : `?cluster=${CLUSTER}`;
  return `${EXPLORER_BASE_URL}/${type}/${value}${clusterParam}`;
}

// Challenge defaults
export const DEFAULT_CHALLENGE_DURATION_DAYS = 7;
// The minimum entry fee (in SOL) - set to 0 to allow free challenges
export const MIN_STAKE_SOL = 0;
export const MAX_STAKE_SOL = 100;

// Fee constants (in basis points)
export const PLATFORM_FEE_BPS = 0; // 0% for MVP

// Validation
export const MAX_TITLE_LENGTH = 50;
export const MAX_DESCRIPTION_LENGTH = 200;
export const MAX_PARTICIPANTS = 100;

// Time constants
export const SECONDS_PER_DAY = 86400;
export const SECONDS_PER_HOUR = 3600;
export const SECONDS_PER_MINUTE = 60;
