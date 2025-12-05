import { describe, it, expect } from 'vitest';
import { MIN_STAKE_SOL } from '../utils/constants';
import { isEntryFeeValid } from '../utils/validation';

describe('Minimum entry fee checks', () => {
  it('MIN_STAKE_SOL is set to 0.02', () => {
    expect(MIN_STAKE_SOL).toBe(0.02);
  });

  it('validation helper correctly accepts and rejects values', () => {
    expect(isEntryFeeValid(undefined as any)).toBe(false);
    expect(isEntryFeeValid(null as any)).toBe(false);
    expect(isEntryFeeValid(0)).toBe(false);
    expect(isEntryFeeValid(0.01)).toBe(false);
    expect(isEntryFeeValid(0.0199999)).toBe(false);
    expect(isEntryFeeValid(0.02)).toBe(true);
    expect(isEntryFeeValid(0.2)).toBe(true);
  });
});
