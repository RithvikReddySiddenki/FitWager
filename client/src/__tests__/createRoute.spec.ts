import { describe, it, expect } from 'vitest';
import { POST as createPOST } from '../app/api/challenges/create/route';

describe('Create route validation', () => {
  it('rejects entry fee below MIN_STAKE_SOL', async () => {
    const smallReq = { json: async () => ({
      title: 'Test',
      creator: 'wallet1',
      challengeType: 'steps',
      goal: 1000,
      entryFee: 0.01,
      durationDays: 7,
    }) } as any;

    const res = await createPOST(smallReq);
    const body = await res.json();

    expect(body.success).toBe(false);
    expect(typeof body.error).toBe('string');
    expect(body.error).toContain('Entry fee must be at least');
  });
});
