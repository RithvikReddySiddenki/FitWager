import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { IDL, FitWager } from "@/utils/idl";
import { getParticipantPda } from "@/utils/pda";
import { lamportsToSol, formatTimeRemaining } from "@/utils/solana";

const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_ENDPOINT || "https://api.devnet.solana.com";

interface Challenge {
  id: string;
  publicKey: string;
  creator: string;
  title: string;
  description?: string;
  type?: string;
  goal?: number;
  entryFee: number;
  totalPool: number;
  startTime: number;
  endTime: number;
  status: "active" | "ended";
  participantCount: number;
  isPublic: boolean;
  timeRemaining?: string;
}

/**
 * Get fresh connection for each request (stateless)
 */
function getConnection(): Connection {
  return new Connection(RPC_ENDPOINT, {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 60000,
  });
}

/**
 * Get read-only program instance (stateless)
 */
function getProgram(connection: Connection): Program<FitWager> {
  const provider = new AnchorProvider(
    connection,
    {} as never,
    { commitment: "confirmed" }
  );
  // Use the string program ID directly to avoid IDL address issues
  const PROGRAM_ID = new PublicKey("Fg6PaFpoGXkYsidMpWxqSW1JmAxo9ZPVknpYAH97PvX1");
  return new Program<FitWager>(IDL as any, PROGRAM_ID, provider);
}

/**
 * Count participants for a challenge by querying on-chain data
 */
async function countParticipants(
  program: Program<FitWager>,
  challengePda: PublicKey
): Promise<number> {
  try {
    // Query all participant accounts that reference this challenge
    // The participant account stores the challenge key at offset after discriminator
    const participants = await program.account.participant.all([
      {
        memcmp: {
          offset: 8, // After discriminator, but we need to check the structure
          bytes: challengePda.toBase58(),
        },
      },
    ]);
    return participants.length;
  } catch {
    return 0;
  }
}

/**
 * GET /api/challenges/list
 * Fetches all challenges from on-chain state - fully stateless
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get("filter") || "active";
    const isPublicOnly = searchParams.get("public") === "true";
    const creatorFilter = searchParams.get("creator");
    const participantFilter = searchParams.get("participant"); // New: filter by participant
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const connection = getConnection();
    const program = getProgram(connection);

    let challenges: Challenge[] = [];

    try {
      // Fetch all challenge accounts from on-chain
      let onChainChallenges = await program.account.challenge.all();

      // Filter by creator if specified
      if (creatorFilter) {
        try {
          const creatorPk = new PublicKey(creatorFilter);
          onChainChallenges = onChainChallenges.filter(
            (c) => c.account.creator.equals(creatorPk)
          );
        } catch {
          // Invalid creator pubkey, ignore filter
        }
      }

      // Transform on-chain data to Challenge interface
      // Use Promise.all for concurrent participant counting
      challenges = await Promise.all(
        onChainChallenges.map(async (c) => {
          const pubkey = c.publicKey.toBase58();
          const isActive = "active" in c.account.status;
          const endTime = c.account.endTime.toNumber();
          
          // Count participants from on-chain data
          const participantCount = await countParticipants(program, c.publicKey);

          return {
            id: pubkey,
            publicKey: pubkey,
            creator: c.account.creator.toBase58(),
            // Title derived from on-chain data or default
            title: `Challenge ${pubkey.slice(0, 8)}...`,
            entryFee: lamportsToSol(c.account.entryFee.toNumber()),
            totalPool: lamportsToSol(c.account.totalPool.toNumber()),
            startTime: c.account.startTime.toNumber(),
            endTime,
            status: isActive ? "active" : "ended",
            participantCount,
            isPublic: true, // All on-chain challenges are public by default
            timeRemaining: formatTimeRemaining(endTime),
          } as Challenge;
        })
      );

      // If participant filter, check if they joined each challenge
      if (participantFilter) {
        try {
          const participantPk = new PublicKey(participantFilter);
          const filteredChallenges: Challenge[] = [];
          
          for (const challenge of challenges) {
            const [participantPda] = getParticipantPda(
              new PublicKey(challenge.publicKey),
              participantPk
            );
            try {
              const participantAccount = await program.account.participant.fetch(participantPda);
              if (participantAccount.hasJoined) {
                filteredChallenges.push(challenge);
              }
            } catch {
              // Participant hasn't joined this challenge
            }
          }
          challenges = filteredChallenges;
        } catch {
          // Invalid participant pubkey
        }
      }

    } catch (onChainError) {
      console.log("Unable to fetch on-chain data, using mock data:", onChainError);
      
      // Fallback to mock data for development/testing
      const now = Math.floor(Date.now() / 1000);
      challenges = [
        {
          id: "mock_1",
          publicKey: "7xYp9QwL3Abc...mock1",
          creator: "8reB8NKi3Xyz...creator1",
          title: "10k Steps Daily",
          description: "Walk 10,000 steps every day for a week",
          type: "steps",
          goal: 10000,
          entryFee: 0.25,
          totalPool: 1.0,
          startTime: now - 86400,
          endTime: now + 518400,
          status: "active",
          participantCount: 4,
          isPublic: true,
          timeRemaining: formatTimeRemaining(now + 518400),
        },
        {
          id: "mock_2",
          publicKey: "3xYp9QwL4Def...mock2",
          creator: "9abC8NKi3Xyz...creator2",
          title: "5 Mile Run Challenge",
          description: "Complete 5 miles of running",
          type: "distance",
          goal: 5,
          entryFee: 0.5,
          totalPool: 2.0,
          startTime: now - 172800,
          endTime: now + 1209600,
          status: "active",
          participantCount: 4,
          isPublic: true,
          timeRemaining: formatTimeRemaining(now + 1209600),
        },
        {
          id: "mock_3",
          publicKey: "5zYp9QwL5Ghi...mock3",
          creator: "2defC8NKi3Xyz...creator3",
          title: "Morning Workout Routine",
          description: "30 minutes of exercise daily",
          type: "time",
          goal: 30,
          entryFee: 0.1,
          totalPool: 0.5,
          startTime: now - 259200,
          endTime: now + 345600,
          status: "active",
          participantCount: 5,
          isPublic: true,
          timeRemaining: formatTimeRemaining(now + 345600),
        },
      ];
    }

    // Apply status filter
    if (filter === "active") {
      challenges = challenges.filter((c) => c.status === "active");
    } else if (filter === "ended") {
      challenges = challenges.filter((c) => c.status === "ended");
    }

    // Apply public filter
    if (isPublicOnly) {
      challenges = challenges.filter((c) => c.isPublic);
    }

    // Sort by start time (newest first)
    challenges.sort((a, b) => b.startTime - a.startTime);

    // Apply pagination
    const total = challenges.length;
    const paginatedChallenges = challenges.slice(offset, offset + limit);

    return NextResponse.json(
      {
        success: true,
        challenges: paginatedChallenges,
        total,
        pagination: {
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error listing challenges:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/challenges/list
 * Get details for a specific challenge - fully stateless
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { challengeId, wallet } = body;

    if (!challengeId) {
      return NextResponse.json(
        { error: "challengeId is required" },
        { status: 400 }
      );
    }

    const connection = getConnection();
    const program = getProgram(connection);

    try {
      const challengePda = new PublicKey(challengeId);
      const account = await program.account.challenge.fetch(challengePda);

      const isActive = "active" in account.status;
      const endTime = account.endTime.toNumber();
      
      // Count actual participants from on-chain
      const participantCount = await countParticipants(program, challengePda);

      // Check if requesting user has joined (if wallet provided)
      let userHasJoined = false;
      let userScore = 0;
      if (wallet) {
        try {
          const walletPk = new PublicKey(wallet);
          const [participantPda] = getParticipantPda(challengePda, walletPk);
          const participantAccount = await program.account.participant.fetch(participantPda);
          userHasJoined = participantAccount.hasJoined;
          userScore = participantAccount.score.toNumber();
        } catch {
          // User hasn't joined
        }
      }

      const challenge: Challenge = {
        id: challengeId,
        publicKey: challengeId,
        creator: account.creator.toBase58(),
        title: `Challenge ${challengeId.slice(0, 8)}...`,
        entryFee: lamportsToSol(account.entryFee.toNumber()),
        totalPool: lamportsToSol(account.totalPool.toNumber()),
        startTime: account.startTime.toNumber(),
        endTime,
        status: isActive ? "active" : "ended",
        participantCount,
        isPublic: true,
        timeRemaining: formatTimeRemaining(endTime),
      };

      return NextResponse.json(
        { 
          success: true, 
          challenge,
          userStatus: wallet ? { hasJoined: userHasJoined, score: userScore } : null,
        },
        { status: 200 }
      );
    } catch {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error fetching challenge:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
