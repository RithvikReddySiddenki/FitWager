import { MIN_STAKE_SOL } from './constants';

/**
 * Validate whether a given entry fee (in SOL) meets the minimum staking requirement
 */
export function isEntryFeeValid(entryFee: number | undefined | null): boolean {
  if (typeof entryFee !== 'number') return false;
  return entryFee >= MIN_STAKE_SOL;
}

export default isEntryFeeValid;
