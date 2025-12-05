/**
 * List Challenges Endpoint
 * 
 * Fetches challenges from the database with filtering options.
 */

import { NextRequest, NextResponse } from 'next/server';
import { listChallenges, getChallenge, listParticipants, getParticipant } from '@/lib/db/storage';
import { ChallengeMetadata } from '@/lib/db/schema';

function formatTimeRemaining(endTime: number): string {
  const now = Math.floor(Date.now() / 1000);
  const remaining = endTime - now;
  
  if (remaining <= 0) return 'Ended';
  
  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('filter') || 'active';
    const isPublicOnly = searchParams.get('public') === 'true';
    const creator = searchParams.get('creator') || undefined;
    const participant = searchParams.get('participant') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Fetch from database
    let challenges = await listChallenges({
      status: status === 'all' ? undefined : status,
      isPublic: isPublicOnly ? true : undefined,
      creator,
    });
    
    console.log('[API] List challenges:', {
      filter: status,
      isPublicOnly,
      creator,
      count: challenges.length,
      challengeIds: challenges.map(c => c.id),
    });
    
    // If filtering by participant, we need to check participation data
    if (participant) {
      const participantChallenges: ChallengeMetadata[] = [];
      for (const challenge of challenges) {
        const participantData = await getParticipant(challenge.id, participant);
        if (participantData?.hasJoined) {
          participantChallenges.push(challenge);
        }
      }
      challenges = participantChallenges;
    }
    
    // Add participant counts and format data
    const enrichedChallenges = await Promise.all(
      challenges.map(async (challenge) => {
        const participants = await listParticipants(challenge.id);
        return {
          ...challenge,
          participantCount: participants.length,
          timeRemaining: formatTimeRemaining(challenge.endTime),
          totalPool: challenge.entryFee * participants.length,
        };
      })
    );
    
    // Sort by start time (newest first)
    enrichedChallenges.sort((a, b) => b.startTime - a.startTime);
    
    // Apply pagination
    const total = enrichedChallenges.length;
    const paginatedChallenges = enrichedChallenges.slice(offset, offset + limit);
    
    return NextResponse.json({
      success: true,
      challenges: paginatedChallenges,
      total,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('List challenges error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to list challenges' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { challengeId, wallet } = body;
    
    if (!challengeId) {
      return NextResponse.json(
        { success: false, error: 'challengeId is required' },
        { status: 400 }
      );
    }
    
    const challenge = await getChallenge(challengeId);
    if (!challenge) {
      return NextResponse.json(
        { success: false, error: 'Challenge not found' },
        { status: 404 }
      );
    }
    
    const participants = await listParticipants(challengeId);
    
    // Check user status if wallet provided
    let userStatus = null;
    if (wallet) {
      const participantData = await getParticipant(challengeId, wallet);
      userStatus = participantData ? {
        hasJoined: participantData.hasJoined,
        score: participantData.score,
        hasSubmitted: participantData.hasSubmitted,
      } : null;
    }
    
    return NextResponse.json({
      success: true,
      challenge: {
        ...challenge,
        participantCount: participants.length,
        totalPool: challenge.entryFee * participants.length,
        timeRemaining: formatTimeRemaining(challenge.endTime),
      },
      userStatus,
    });
  } catch (error) {
    console.error('Get challenge error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get challenge' 
      },
      { status: 500 }
    );
  }
}
