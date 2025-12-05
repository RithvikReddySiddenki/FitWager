/**
 * Create Challenge Endpoint
 * 
 * Creates a new fitness challenge with metadata stored off-chain
 * and escrow created on-chain.
 */

import { NextRequest, NextResponse } from 'next/server';
import { upsertChallenge } from '@/lib/db/storage';
import { ChallengeMetadata, ChallengeType } from '@/lib/db/schema';
import { v4 as uuidv4 } from 'uuid';
import { MIN_STAKE_SOL, MAX_STAKE_SOL } from '@/utils/constants';
import { isEntryFeeValid } from '@/utils/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      creator,
      challengeType,
      goal,
      entryFee,
      durationDays,
      isUsdc = false,
      isPublic = true,
      onChainId, // The PDA from on-chain creation
    } = body;
    
    // Validation (entryFee can be 0, so check !== undefined instead of truthy)
    if (!title || !creator || !challengeType || goal === undefined || entryFee === undefined || !durationDays) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: title, creator, challengeType, goal, entryFee, durationDays' 
        },
        { status: 400 }
      );
    }
    
    // Validate challenge type
    const validTypes: ChallengeType[] = ['steps', 'distance', 'duration', 'calories'];
    if (!validTypes.includes(challengeType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid challenge type' },
        { status: 400 }
      );
    }
    
    // Validate goal and duration (entry fee can be 0 for free challenges)
    if (goal <= 0 || durationDays <= 0) {
      return NextResponse.json(
        { success: false, error: 'Goal and durationDays must be positive' },
        { status: 400 }
      );
    }

    // Validate entry fee (allows 0 for free challenges, but must be non-negative)
    if (entryFee < 0 || entryFee > MAX_STAKE_SOL) {
      return NextResponse.json(
        { success: false, error: `Entry fee must be between 0 and ${MAX_STAKE_SOL} SOL` },
        { status: 400 }
      );
    }
    
    const now = Math.floor(Date.now() / 1000);
    const endTime = now + (durationDays * 24 * 60 * 60);
    
    // Use on-chain ID if provided, otherwise generate a temporary one
    const id = onChainId || `pending_${uuidv4()}`;
    
    const challenge: ChallengeMetadata = {
      id,
      title: title.slice(0, 100), // Max 100 chars
      description: description?.slice(0, 500), // Max 500 chars
      creator,
      challengeType,
      goal,
      entryFee,
      isUsdc,
      isPublic,
      startTime: now,
      endTime,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    const savedChallenge = await upsertChallenge(challenge);
    
    console.log('[API] Challenge created successfully:', {
      id: savedChallenge.id,
      title: savedChallenge.title,
      isPublic: savedChallenge.isPublic,
      entryFee: savedChallenge.entryFee,
    });
    
    return NextResponse.json({
      success: true,
      challenge: savedChallenge,
    });
  } catch (error) {
    console.error('Create challenge error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create challenge' 
      },
      { status: 500 }
    );
  }
}
