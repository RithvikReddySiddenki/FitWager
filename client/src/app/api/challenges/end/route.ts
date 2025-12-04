import { NextRequest, NextResponse } from "next/server";
import { PublicKey, SystemProgram, SYSVAR_CLOCK_PUBKEY } from "@solana/web3.js";
import { getVaultPda, getParticipantPda } from "@/utils/pda";

interface EndChallengeRequest {
  creator: string;
  challengePda: string;
  winner?: string; // Optional - if not provided, winner is determined by highest score
  participants?: Array<{
    wallet: string;
    score: number;
  }>;
}

interface WinnerDetermination {
  winner: string;
  score: number;
  method: "highest_score" | "provided" | "random";
}

/**
 * Determine the winner of a challenge
 */
function determineWinner(
  participants: Array<{ wallet: string; score: number }>,
  providedWinner?: string
): WinnerDetermination | null {
  if (providedWinner) {
    const participant = participants.find((p) => p.wallet === providedWinner);
    return {
      winner: providedWinner,
      score: participant?.score || 0,
      method: "provided",
    };
  }

  if (participants.length === 0) {
    return null;
  }

  // Sort by score descending
  const sorted = [...participants].sort((a, b) => b.score - a.score);
  
  // Check for ties
  const topScore = sorted[0].score;
  const topParticipants = sorted.filter((p) => p.score === topScore);

  if (topParticipants.length === 1) {
    return {
      winner: topParticipants[0].wallet,
      score: topScore,
      method: "highest_score",
    };
  }

  // Tie-breaker: random selection among tied participants
  const randomIndex = Math.floor(Math.random() * topParticipants.length);
  return {
    winner: topParticipants[randomIndex].wallet,
    score: topScore,
    method: "random",
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: EndChallengeRequest = await request.json();

    // Validate input
    if (!body.creator || !body.challengePda) {
      return NextResponse.json(
        { error: "Invalid input: creator and challengePda are required" },
        { status: 400 }
      );
    }

    const creator = new PublicKey(body.creator);
    const challengePda = new PublicKey(body.challengePda);

    // Get vault PDA
    const [vaultPda, vaultBump] = getVaultPda(challengePda);

    // Determine winner
    let winnerResult: WinnerDetermination | null = null;
    
    if (body.winner) {
      winnerResult = {
        winner: body.winner,
        score: 0,
        method: "provided",
      };
    } else if (body.participants && body.participants.length > 0) {
      winnerResult = determineWinner(body.participants, body.winner);
    }

    if (!winnerResult) {
      return NextResponse.json(
        { error: "Unable to determine winner: no participants or winner provided" },
        { status: 400 }
      );
    }

    const winner = new PublicKey(winnerResult.winner);

    return NextResponse.json(
      {
        success: true,
        message: "End challenge data prepared",
        data: {
          challengePda: challengePda.toBase58(),
          vaultPda: vaultPda.toBase58(),
          vaultBump,
          creator: creator.toBase58(),
          winner: {
            pubkey: winner.toBase58(),
            score: winnerResult.score,
            method: winnerResult.method,
          },
          status: "ended",
          // Account metas for transaction building
          accounts: {
            creator: body.creator,
            challenge: challengePda.toBase58(),
            escrowVault: vaultPda.toBase58(),
            winner: winner.toBase58(),
            systemProgram: SystemProgram.programId.toBase58(),
            clock: SYSVAR_CLOCK_PUBKEY.toBase58(),
          },
          // Instruction args
          args: {
            vaultBump,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error ending challenge:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
