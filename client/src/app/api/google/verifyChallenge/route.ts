/**
 * Challenge Verification Endpoint
 * 
 * Verifies a user's fitness data against a specific challenge.
 * Returns the verification result and score for on-chain submission.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyChallengeFitness, hashToBytes } from '@/lib/fitness/verifyGoogleFit';
import { upsertVerification, upsertParticipant, getParticipant } from '@/lib/db/storage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet, challengeId } = body;
    
    if (!wallet || !challengeId) {
      return NextResponse.json(
        { success: false, error: 'Wallet and challengeId are required' },
        { status: 400 }
      );
    }
    
    // Verify fitness data for the challenge
    const result = await verifyChallengeFitness(wallet, challengeId);
    
    if (!result.success || !result.verification) {
      return NextResponse.json(
        { success: false, error: result.error || 'Verification failed' },
        { status: 400 }
      );
    }
    
    // Store verification result
    await upsertVerification(result.verification);
    
    // Update participant data
    const participant = await getParticipant(challengeId, wallet);
    if (participant) {
      await upsertParticipant({
        ...participant,
        score: result.verification.calculatedScore,
        hasSubmitted: true,
        lastVerification: Date.now(),
        verificationData: result.verification,
      });
    }
    
    // Convert hash to bytes for on-chain submission
    const verificationHashBytes = hashToBytes(result.verification.verificationHash);
    
    return NextResponse.json({
      success: true,
      verification: {
        ...result.verification,
        verificationHashBytes,
      },
      readyForSubmission: true,
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Verification failed' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const wallet = searchParams.get('wallet');
    const challengeId = searchParams.get('challengeId');
    
    if (!wallet || !challengeId) {
      return NextResponse.json(
        { success: false, error: 'Wallet and challengeId are required' },
        { status: 400 }
      );
    }
    
    // Get existing verification
    const participant = await getParticipant(challengeId, wallet);
    
    if (!participant?.verificationData) {
      return NextResponse.json(
        { success: false, error: 'No verification found', needsVerification: true },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      verification: participant.verificationData,
      lastVerified: participant.lastVerification,
    });
  } catch (error) {
    console.error('Get verification error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get verification' 
      },
      { status: 500 }
    );
  }
}

