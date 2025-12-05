/**
 * USDC Payout Endpoint
 * 
 * Handles USDC payouts for challenge winners.
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  processUsdcPayout, 
  microUnitsToUsdc 
} from '@/lib/payments/circleClient';
import { getChallenge, listParticipants } from '@/lib/db/storage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { challengeId, winnerWallet, amount, signature } = body;
    
    if (!challengeId || !winnerWallet) {
      return NextResponse.json(
        { success: false, error: 'ChallengeId and winnerWallet are required' },
        { status: 400 }
      );
    }
    
    // Get challenge to verify
    const challenge = await getChallenge(challengeId);
    if (!challenge) {
      return NextResponse.json(
        { success: false, error: 'Challenge not found' },
        { status: 404 }
      );
    }
    
    if (!challenge.isUsdc) {
      return NextResponse.json(
        { success: false, error: 'Challenge does not use USDC' },
        { status: 400 }
      );
    }
    
    // Process payout through Circle
    const payoutResult = await processUsdcPayout(
      winnerWallet,
      challengeId,
      amount || microUnitsToUsdc(challenge.entryFee)
    );
    
    if (!payoutResult.success) {
      return NextResponse.json(
        { success: false, error: payoutResult.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      transferId: payoutResult.transferId,
      winner: winnerWallet,
      amount: amount || microUnitsToUsdc(challenge.entryFee),
      currency: 'USDC',
    });
  } catch (error) {
    console.error('Payout error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Payout processing failed' 
      },
      { status: 500 }
    );
  }
}

