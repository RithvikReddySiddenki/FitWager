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
