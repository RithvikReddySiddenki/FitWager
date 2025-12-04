import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { IDL, FitWager } from "@/utils/idl";
import { getParticipantPda } from "@/utils/pda";

const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_ENDPOINT || "https://api.devnet.solana.com";
const PROGRAM_ID_STR = "Fg6PaFpoGXkYsidMpWxqSW1JmAxo9ZPVknpYAH97PvX1";

interface Participant {
  wallet: string;
  participantPda: string;
  score: number;
  hasJoined: boolean;
  rank?: number;
}

function getProgram(connection: Connection): Program<FitWager> {
  const provider = new AnchorProvider(
    connection,
    {} as never,
    { commitment: "confirmed" }
  );
  const PROGRAM_ID = new PublicKey(PROGRAM_ID_STR);
  return new Program<FitWager>(IDL as any, PROGRAM_ID, provider);
}

/**
 * GET /api/challenges/participants?challengeId=xxx
 * Fetches all participants for a challenge from on-chain state
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const challengeId = searchParams.get("challengeId");
    const sortBy = searchParams.get("sortBy") || "score"; // score, wallet

    if (!challengeId) {
      return NextResponse.json(
        { error: "challengeId is required" },
        { status: 400 }
      );
    }

    let challengePda: PublicKey;
    try {
      challengePda = new PublicKey(challengeId);
    } catch {
      return NextResponse.json(
        { error: "Invalid challengeId" },
        { status: 400 }
      );
    }

    const connection = new Connection(RPC_ENDPOINT, {
      commitment: "confirmed",
      confirmTransactionInitialTimeout: 60000,
    });
    
    const program = getProgram(connection);

    // Verify challenge exists
    try {
      await program.account.challenge.fetch(challengePda);
    } catch {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    // Fetch all participant accounts
    const allParticipants = await program.account.participant.all();
    
    // Filter participants for this challenge
    const participants: Participant[] = [];
    
    for (const p of allParticipants) {
      const playerPubkey = p.account.player;
      const [expectedPda] = getParticipantPda(challengePda, playerPubkey);
      
      if (expectedPda.equals(p.publicKey) && p.account.hasJoined) {
        participants.push({
          wallet: playerPubkey.toBase58(),
          participantPda: p.publicKey.toBase58(),
          score: p.account.score.toNumber(),
          hasJoined: p.account.hasJoined,
        });
      }
    }

    // Sort participants
    if (sortBy === "score") {
      participants.sort((a, b) => b.score - a.score);
    } else if (sortBy === "wallet") {
      participants.sort((a, b) => a.wallet.localeCompare(b.wallet));
    }

    // Add ranks
    participants.forEach((p, index) => {
      p.rank = index + 1;
    });

    // Determine winner (highest score)
    const winner = participants.length > 0 ? participants[0] : null;

    return NextResponse.json(
      {
        success: true,
        challengeId,
        participants,
        count: participants.length,
        winner: winner ? {
          wallet: winner.wallet,
          score: winner.score,
        } : null,
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

/**
 * POST /api/challenges/participants
 * Check if a specific user has joined a challenge
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { challengeId, wallet } = body;

    if (!challengeId || !wallet) {
      return NextResponse.json(
        { error: "challengeId and wallet are required" },
        { status: 400 }
      );
    }

    let challengePda: PublicKey;
    let walletPk: PublicKey;
    
    try {
      challengePda = new PublicKey(challengeId);
      walletPk = new PublicKey(wallet);
    } catch {
      return NextResponse.json(
        { error: "Invalid challengeId or wallet" },
        { status: 400 }
      );
    }

    const connection = new Connection(RPC_ENDPOINT, {
      commitment: "confirmed",
    });
    
    const program = getProgram(connection);

    // Get participant PDA
    const [participantPda] = getParticipantPda(challengePda, walletPk);

    try {
      const participantAccount = await program.account.participant.fetch(participantPda);
      
      return NextResponse.json(
        {
          success: true,
          hasJoined: participantAccount.hasJoined,
          score: participantAccount.score.toNumber(),
          participantPda: participantPda.toBase58(),
        },
        { status: 200 }
      );
    } catch {
      // Participant account doesn't exist - user hasn't joined
      return NextResponse.json(
        {
          success: true,
          hasJoined: false,
          score: 0,
          participantPda: participantPda.toBase58(),
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error checking participant:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
