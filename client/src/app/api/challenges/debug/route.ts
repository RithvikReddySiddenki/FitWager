/**
 * Debug Endpoint for Supabase Connection
 * 
 * Use this to test if Supabase is working correctly
 * GET /api/challenges/debug
 */

import { NextRequest, NextResponse } from 'next/server';
import { listChallenges } from '@/lib/db/storage';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const isUsingSupabase = !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_KEY;
    
    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      supabaseConfigured: isUsingSupabase,
      supabaseUrl: process.env.SUPABASE_URL ? 
        process.env.SUPABASE_URL.substring(0, 30) + '...' : 
        'Not set',
      hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
      serviceKeyLength: process.env.SUPABASE_SERVICE_KEY?.length || 0,
    };

    if (isUsingSupabase) {
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_KEY;
      const cleanUrl = url?.endsWith('/') ? url.slice(0, -1) : url;
      
      if (cleanUrl && key) {
        const client = createClient(cleanUrl, key, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        // Test connection
        const { data: testData, error: testError } = await client
          .from('competitions')
          .select('id')
          .limit(1);
        
        debugInfo.connectionTest = {
          success: !testError,
          error: testError?.message || null,
          canRead: !testError,
        };

        // Get count
        const { count, error: countError } = await client
          .from('competitions')
          .select('*', { count: 'exact', head: true });
        
        debugInfo.totalChallenges = count || 0;
        debugInfo.countError = countError?.message || null;

        // Get public challenges count
        const { count: publicCount, error: publicError } = await client
          .from('competitions')
          .select('*', { count: 'exact', head: true })
          .eq('is_public', true);
        
        debugInfo.publicChallenges = publicCount || 0;
        debugInfo.publicCountError = publicError?.message || null;

        // Test listChallenges function
        try {
          const challenges = await listChallenges({ isPublic: true });
          debugInfo.listChallengesFunction = {
            success: true,
            count: challenges.length,
          };
        } catch (listError: any) {
          debugInfo.listChallengesFunction = {
            success: false,
            error: listError.message,
          };
        }
      } else {
        debugInfo.clientError = 'Missing SUPABASE_URL or SUPABASE_SERVICE_KEY';
      }
    }

    return NextResponse.json({
      success: true,
      debug: debugInfo,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
