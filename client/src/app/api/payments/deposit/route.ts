/**
 * USDC Deposit Endpoint
 * 
 * Handles USDC entry fee deposits for challenges.
 * Returns deposit instructions or address for the user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  processUsdcDeposit, 
  isCircleAvailable,
  usdcToMicroUnits 
} from '@/lib/payments/circleClient';
import { USDC_ADDRESSES } from '@/lib/payments/circleClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet, challengeId, amount, network = 'devnet' } = body;
    
    if (!wallet || !challengeId || !amount) {
      return NextResponse.json(
        { success: false, error: 'Wallet, challengeId, and amount are required' },
        { status: 400 }
      );
    }
    
    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }
    
    // Try Circle integration first
    const circleResult = await processUsdcDeposit(wallet, challengeId, amount);
    
    if (circleResult.success && circleResult.depositAddress) {
      // Circle deposit address available
      return NextResponse.json({
        success: true,
        method: 'circle',
        depositAddress: circleResult.depositAddress,
        amount,
        amountMicroUnits: usdcToMicroUnits(amount),
        currency: 'USDC',
      });
    }
    
    // Fallback to direct SPL token transfer
    const usdcMint = network === 'mainnet' 
      ? USDC_ADDRESSES.mainnet 
      : USDC_ADDRESSES.devnet;
    
    return NextResponse.json({
      success: true,
      method: 'direct',
      usdcMint,
      amount,
      amountMicroUnits: usdcToMicroUnits(amount),
      currency: 'USDC',
      instructions: 'Transfer USDC directly to the challenge escrow using SPL token transfer',
    });
  } catch (error) {
    console.error('Deposit error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Deposit processing failed' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Return deposit status/info
  const searchParams = request.nextUrl.searchParams;
  const wallet = searchParams.get('wallet');
  const challengeId = searchParams.get('challengeId');
  
  return NextResponse.json({
    success: true,
    circleAvailable: isCircleAvailable(),
    supportedCurrencies: ['SOL', 'USDC'],
    usdcDecimals: 6,
    networks: ['devnet', 'mainnet'],
  });
}

