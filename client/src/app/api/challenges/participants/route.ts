import { NextRequest, NextResponse } from "next/server";

interface Participant {
  wallet: string;
  score: number;
  hasJoined: boolean;
  joinedAt?: number;
}

/**
 * GET /api/challenges/participants
 * Returns participants for a challenge - mock data for MVP
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const challengeId = searchParams.get("challengeId");

    if (!challengeId) {
      return NextResponse.json(
        { error: "challengeId is required" },
        { status: 400 }
      );
    }

    // Mock participants for testing
    const participants: Participant[] = [
      {
        wallet: "7xYp9QwL3AbcDefGhiJklMnoPqrStuVwXyZ123456789",
        score: 12500,
        hasJoined: true,
        joinedAt: Date.now() - 86400000,
      },
      {
        wallet: "3xYp9QwL4DefGhiJklMnoPqrStuVwXyZ234567890ab",
        score: 9800,
        hasJoined: true,
        joinedAt: Date.now() - 172800000,
      },
      {
        wallet: "5zYp9QwL5GhiJklMnoPqrStuVwXyZ345678901cdef",
        score: 8200,
        hasJoined: true,
        joinedAt: Date.now() - 259200000,
      },
    ];

    // Sort by score descending
    participants.sort((a, b) => b.score - a.score);

    return NextResponse.json(
      {
        success: true,
        challengeId,
        participants,
        total: participants.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching participants:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
