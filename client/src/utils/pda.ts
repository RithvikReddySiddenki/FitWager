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
  
  // Validate program ID format
  if (!programIdStr || typeof programIdStr !== 'string') {
    throw new Error('Program ID is not set. Please set NEXT_PUBLIC_PROGRAM_ID in .env.local');
  }
  
  // Check for invalid characters (Base58 should only contain alphanumeric except 0, O, I, l)
  if (programIdStr.length < 32 || programIdStr.length > 44) {
    throw new Error(`Invalid program ID length: ${programIdStr.length}. Expected 32-44 characters.`);
  }
  
  try {
    return new PublicKey(programIdStr);
  } catch (error) {
    throw new Error(`Invalid program ID format (non-base58 character): ${programIdStr}. Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get challenge PDA
 * Seeds: [b"challenge", creator_key, timestamp]
 */
export function getChallengePda(
  creator: PublicKey,
  timestamp: number
): [PublicKey, number] {
  const timestampBytes = Buffer.alloc(8);
  timestampBytes.writeBigInt64LE(BigInt(timestamp), 0);

  return PublicKey.findProgramAddressSync(
    [Buffer.from("challenge"), creator.toBuffer(), timestampBytes],
    getProgramId()
  );
}

/**
 * Get vault (escrow) PDA
 * Seeds: [b"vault", challenge_key]
 */
export function getVaultPda(challengePk: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), challengePk.toBuffer()],
    getProgramId()
  );
}

/**
 * Get participant PDA
 * Seeds: [b"participant", challenge_key, player_key]
 */
export function getParticipantPda(
  challengePk: PublicKey,
  playerPk: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("participant"), challengePk.toBuffer(), playerPk.toBuffer()],
    getProgramId()
  );
}

/**
 * Validate if a string is a valid public key
 */
export function isValidPublicKey(key: string): boolean {
  try {
    new PublicKey(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Shorten a public key for display
 */
export function shortenPublicKey(key: PublicKey | string, chars: number = 4): string {
  const keyStr = typeof key === "string" ? key : key.toBase58();
  return `${keyStr.slice(0, chars)}...${keyStr.slice(-chars)}`;
}

/**
 * Parse public key from string, returns null if invalid
 */
export function parsePublicKey(key: string): PublicKey | null {
  try {
    return new PublicKey(key);
  } catch {
    return null;
  }
}
