/**
 * Google OAuth Authorization Endpoint
 * 
 * Generates the OAuth URL for users to connect their Google Fit account.
 * The wallet address is passed as state to link the Google account to the wallet.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizationUrl } from '@/lib/fitness/googleFitClient';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const wallet = searchParams.get('wallet');
    
    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400 }
      );
    }
    
    // Validate wallet format (basic check for Solana public key)
    if (wallet.length < 32 || wallet.length > 44) {
      return NextResponse.json(
        { success: false, error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }
    
    // Generate OAuth URL with wallet as state
    // State format: base64 encoded JSON with wallet and timestamp
    const state = Buffer.from(JSON.stringify({
      wallet,
      timestamp: Date.now(),
    })).toString('base64');
    
    const authUrl = getAuthorizationUrl(state);
    
    return NextResponse.json({
      success: true,
      authUrl,
    });
  } catch (error) {
    console.error('Google auth error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate auth URL' 
      },
      { status: 500 }
    );
  }
}

