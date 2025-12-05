import { MIN_STAKE_SOL } from './constants';

/**
 * Validate whether a given entry fee (in SOL) is valid
 * Allows 0 SOL for free challenges, but rejects negative values
 */
export function isEntryFeeValid(entryFee: number | undefined | null): boolean {
  if (typeof entryFee !== 'number') return false;
  // Allow 0 SOL for free challenges, but reject negative values
  return entryFee >= 0 && entryFee <= 100; // Max 100 SOL
}

export default isEntryFeeValid;
