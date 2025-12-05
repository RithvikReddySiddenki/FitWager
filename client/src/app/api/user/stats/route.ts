import { NextRequest, NextResponse } from "next/server";

interface UserStats {
  totalChallengesCreated: number;
  totalChallengesJoined: number;
  activeChallenges: number;
  totalWins: number;
  totalEarned: number; // in SOL
  winRate: number; // percentage
  recentChallenges: Array<{
    id: string;
    title: string;
    status: "active" | "ended";
    stake: number;
    role: "creator" | "participant";
    score?: number;
  }>;
}

/**
 * GET /api/user/stats
 * Returns user statistics - mock data for MVP
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const wallet = searchParams.get("wallet");

    if (!wallet) {
      return NextResponse.json(
        { error: "wallet parameter is required" },
        { status: 400 }
      );
    }

    // Mock user stats for testing
    const stats: UserStats = {
      totalChallengesCreated: 2,
      totalChallengesJoined: 5,
      activeChallenges: 3,
      totalWins: 2,
      totalEarned: 1.5,
      winRate: 40,
      recentChallenges: [
        {
          id: "challenge_1",
          title: "10K Steps Daily",
          status: "active",
          stake: 0.25,
          role: "participant",
          score: 8500,
        },
        {
          id: "challenge_2",
          title: "5 Mile Run",
          status: "active",
          stake: 0.5,
          role: "creator",
          score: 3,
        },
        {
          id: "challenge_3",
          title: "Morning Workout",
          status: "ended",
          stake: 0.1,
          role: "participant",
          score: 45,
        },
      ],
    };

    return NextResponse.json(
      {
        success: true,
        wallet,
        stats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
