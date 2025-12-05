import { PublicKey } from "@solana/web3.js";
import { getProgramId as getProgramIdFromConstants } from "./constants";

/**
 * Re-export getProgramId from constants to maintain compatibility
 */
export function getProgramId(): PublicKey {
  return getProgramIdFromConstants();
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
