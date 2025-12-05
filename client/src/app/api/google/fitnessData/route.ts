/**
 * Google Fitness Data Endpoint
 * 
 * Fetches and returns fitness data for a user.
 * Can fetch data for a specific time range or default to last 7 days.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser, updateUserTokens } from '@/lib/db/storage';
import { 
  getChallengeFitnessData, 
  refreshAccessToken 
} from '@/lib/fitness/googleFitClient';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const wallet = searchParams.get('wallet');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');
    
    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400 }
      );
    }
    
    // Get user and check Google connection
    const user = await getUser(wallet);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    if (!user.googleAccessToken) {
      return NextResponse.json(
        { success: false, error: 'Google Fit not connected', needsAuth: true },
        { status: 401 }
      );
    }
    
    // Check if token needs refresh
    let accessToken = user.googleAccessToken;
    if (user.googleTokenExpiry && user.googleTokenExpiry < Date.now()) {
      if (!user.googleRefreshToken) {
        return NextResponse.json(
          { success: false, error: 'Google token expired, please reconnect', needsAuth: true },
          { status: 401 }
        );
      }
      
      try {
        const refreshed = await refreshAccessToken(user.googleRefreshToken);
        accessToken = refreshed.accessToken;
        await updateUserTokens(wallet, {
          googleAccessToken: refreshed.accessToken,
          googleTokenExpiry: refreshed.expiryDate,
        });
      } catch (error) {
        return NextResponse.json(
          { success: false, error: 'Failed to refresh token, please reconnect', needsAuth: true },
          { status: 401 }
        );
      }
    }
    
    // Calculate time range
    const now = Date.now();
    const defaultEndTime = now;
    const defaultStartTime = now - (7 * 24 * 60 * 60 * 1000); // 7 days ago
    
    const start = startTime ? parseInt(startTime) : defaultStartTime;
    const end = endTime ? parseInt(endTime) : defaultEndTime;
    
    // Fetch fitness data
    const fitnessData = await getChallengeFitnessData(accessToken, start, end);
    
    return NextResponse.json({
      success: true,
      data: fitnessData,
      timeRange: {
        start,
        end,
      },
      lastSynced: Date.now(),
    });
  } catch (error) {
    console.error('Fitness data error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch fitness data' 
      },
      { status: 500 }
    );
  }
}

