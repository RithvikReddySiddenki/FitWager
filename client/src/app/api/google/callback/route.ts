/**
 * Google OAuth Callback Endpoint
 * 
 * Handles the OAuth callback from Google, exchanges the code for tokens,
 * and stores the user's Google connection.
 */

import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, getUserProfile } from '@/lib/fitness/googleFitClient';
import { getUser, upsertUser } from '@/lib/db/storage';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    // Handle OAuth errors
    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/dashboard?error=google_auth_denied`, request.url)
      );
    }
    
    if (!code) {
      return NextResponse.redirect(
        new URL(`/dashboard?error=missing_code`, request.url)
      );
    }
    
    // Decode state to get wallet address
    let walletAddress: string;
    try {
      const stateData = JSON.parse(Buffer.from(state || '', 'base64').toString());
      walletAddress = stateData.wallet;
      
      // Verify state timestamp (expires after 10 minutes)
      if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
        return NextResponse.redirect(
          new URL(`/dashboard?error=auth_expired`, request.url)
        );
      }
    } catch {
      return NextResponse.redirect(
        new URL(`/dashboard?error=invalid_state`, request.url)
      );
    }
    
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    
    // Get user profile from Google
    const googleProfile = await getUserProfile(tokens.accessToken);
    
    // Get or create user
    let user = await getUser(walletAddress);
    const isNewUser = !user;
    
    // Update or create user with Google connection
    user = await upsertUser({
      id: walletAddress,
      googleId: googleProfile.id,
      googleEmail: googleProfile.email,
      googleAccessToken: tokens.accessToken,
      googleRefreshToken: tokens.refreshToken,
      googleTokenExpiry: tokens.expiryDate,
      createdAt: user?.createdAt || Date.now(),
      updatedAt: Date.now(),
    });
    
    // Redirect to dashboard with success
    const redirectUrl = new URL('/dashboard', request.url);
    redirectUrl.searchParams.set('google_connected', 'true');
    if (isNewUser) {
      redirectUrl.searchParams.set('new_user', 'true');
    }
    
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Google callback error:', error);
    return NextResponse.redirect(
      new URL(`/dashboard?error=google_auth_failed`, request.url)
    );
  }
}

