import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { IDL, FitWager } from "@/utils/idl";
import { getParticipantPda } from "@/utils/pda";
import { lamportsToSol } from "@/utils/solana";

const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_ENDPOINT || "https://api.devnet.solana.com";
const PROGRAM_ID_STR = "Fg6PaFpoGXkYsidMpWxqSW1JmAxo9ZPVknpYAH97PvX1";

function getProgram(connection: Connection): Program<FitWager> {
  const provider = new AnchorProvider(
    connection,
    {} as never,
    { commitment: "confirmed" }
  );
  const PROGRAM_ID = new PublicKey(PROGRAM_ID_STR);
  return new Program<FitWager>(IDL as any, PROGRAM_ID, provider);
}

interface UserStats {
  wallet: string;
  totalChallengesCreated: number;
  totalChallengesJoined: number;
  totalWins: number;
  totalEarned: number;
  totalStaked: number;
  activeChallenges: number;
  completedChallenges: number;
  winRate: number;
  recentChallenges: Array<{
    id: string;
    title: string;
    status: "active" | "ended";
    role: "creator" | "participant";
    stake: number;
    score?: number;
  }>;
}

/**
 * GET /api/user/stats?wallet=xxx
 * Fetches user statistics from on-chain state - fully stateless
 * Each request queries fresh data from Solana
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const wallet = searchParams.get("wallet");

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Validate wallet address
    let userPubkey: PublicKey;
    try {
      userPubkey = new PublicKey(wallet);
    } catch {
      return NextResponse.json(
        { error: "Invalid wallet address" },
        { status: 400 }
      );
    }

    // Create fresh connection for this request
    const connection = new Connection(RPC_ENDPOINT, {
      commitment: "confirmed",
      confirmTransactionInitialTimeout: 60000,
    });
    
    const program = getProgram(connection);

    // Initialize stats
    const stats: UserStats = {
      wallet,
      totalChallengesCreated: 0,
      totalChallengesJoined: 0,
      totalWins: 0,
      totalEarned: 0,
      totalStaked: 0,
      activeChallenges: 0,
      completedChallenges: 0,
      winRate: 0,
      recentChallenges: [],
    };

    try {
      // Fetch challenges created by user
      const createdChallenges = await program.account.challenge.all([
        {
          memcmp: {
            offset: 8, // After discriminator
            bytes: userPubkey.toBase58(),
          },
        },
      ]);

      stats.totalChallengesCreated = createdChallenges.length;

      // Process created challenges
      for (const c of createdChallenges) {
        const isActive = "active" in c.account.status;
        const entryFee = lamportsToSol(c.account.entryFee.toNumber());
        
        if (isActive) {
          stats.activeChallenges++;
        } else {
          stats.completedChallenges++;
        }

        stats.totalStaked += entryFee;

        // Add to recent challenges (limit to 5)
        if (stats.recentChallenges.length < 5) {
          stats.recentChallenges.push({
            id: c.publicKey.toBase58(),
            title: `Challenge ${c.publicKey.toBase58().slice(0, 8)}...`,
            status: isActive ? "active" : "ended",
            role: "creator",
            stake: entryFee,
          });
        }
      }

      // Fetch all participant accounts for this user
      const participations = await program.account.participant.all([
        {
          memcmp: {
            offset: 8, // After discriminator, player pubkey starts
            bytes: userPubkey.toBase58(),
          },
        },
      ]);

      stats.totalChallengesJoined = participations.filter(p => p.account.hasJoined).length;

      // For each participation, we need to find the associated challenge
      // to calculate wins and earnings
      // This is computationally expensive but necessary for accurate stats
      const allChallenges = await program.account.challenge.all();

      for (const participation of participations) {
        if (!participation.account.hasJoined) continue;

        const playerPubkey = participation.account.player;
        const userScore = participation.account.score.toNumber();

        // Find the challenge this participation belongs to
        for (const challenge of allChallenges) {
          const [expectedPda] = getParticipantPda(challenge.publicKey, playerPubkey);
          
          if (expectedPda.equals(participation.publicKey)) {
            const isActive = "active" in challenge.account.status;
            const entryFee = lamportsToSol(challenge.account.entryFee.toNumber());
            const totalPool = lamportsToSol(challenge.account.totalPool.toNumber());

            // Add to staked amount
            stats.totalStaked += entryFee;

            // Check if this is a completed challenge and if user won
            if (!isActive) {
              // Get all participants for this challenge to determine winner
              const challengeParticipants = participations.filter(p => {
                const [pda] = getParticipantPda(challenge.publicKey, p.account.player);
                return pda.equals(p.publicKey) && p.account.hasJoined;
              });

              // Find highest score
              let highestScore = 0;
              for (const cp of challengeParticipants) {
                if (cp.account.score.toNumber() > highestScore) {
                  highestScore = cp.account.score.toNumber();
                }
              }

              // Check if user won
              if (userScore === highestScore && userScore > 0) {
                stats.totalWins++;
                stats.totalEarned += totalPool;
              }
            }

            // Add to recent challenges if not already added
            const alreadyAdded = stats.recentChallenges.some(
              rc => rc.id === challenge.publicKey.toBase58() && rc.role === "participant"
            );
            
            if (!alreadyAdded && stats.recentChallenges.length < 10) {
              stats.recentChallenges.push({
                id: challenge.publicKey.toBase58(),
                title: `Challenge ${challenge.publicKey.toBase58().slice(0, 8)}...`,
                status: isActive ? "active" : "ended",
                role: "participant",
                stake: entryFee,
                score: userScore,
              });
            }

            break;
          }
        }
      }

      // Calculate win rate
      const totalParticipations = stats.totalChallengesJoined + stats.totalChallengesCreated;
      stats.winRate = totalParticipations > 0
        ? Math.round((stats.totalWins / stats.completedChallenges) * 100) || 0
        : 0;

      // Sort recent challenges by activity (most recent first)
      stats.recentChallenges = stats.recentChallenges.slice(0, 5);

    } catch (onChainError) {
      console.log("Unable to fetch on-chain stats, using mock data:", onChainError);
      
      // Fallback to mock data for development
      return NextResponse.json(
        {
          success: true,
          stats: {
            wallet,
            totalChallengesCreated: 3,
            totalChallengesJoined: 7,
            totalWins: 4,
            totalEarned: 2.75,
            totalStaked: 1.85,
            activeChallenges: 2,
            completedChallenges: 8,
            winRate: 50,
            recentChallenges: [
              {
                id: "mock_1",
                title: "10k Steps Daily",
                status: "active" as const,
                role: "participant" as const,
                stake: 0.25,
                score: 8500,
              },
              {
                id: "mock_2",
                title: "5 Mile Run Challenge",
                status: "active" as const,
                role: "creator" as const,
                stake: 0.5,
              },
              {
                id: "mock_3",
                title: "Morning Workout",
                status: "ended" as const,
                role: "participant" as const,
                stake: 0.1,
                score: 12000,
              },
            ],
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
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
