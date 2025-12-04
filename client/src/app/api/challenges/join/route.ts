import { NextRequest, NextResponse } from "next/server";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { getParticipantPda, getVaultPda } from "@/utils/pda";

interface JoinChallengeRequest {
  player: string;
  challengePda: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: JoinChallengeRequest = await request.json();

    // Validate input
    if (!body.player || !body.challengePda) {
      return NextResponse.json(
        { error: "Invalid input: player and challengePda are required" },
        { status: 400 }
      );
    }

    const player = new PublicKey(body.player);
    const challengePda = new PublicKey(body.challengePda);

    // Get PDAs
    const [participantPda, participantBump] = getParticipantPda(challengePda, player);
    const [vaultPda, vaultBump] = getVaultPda(challengePda);

    return NextResponse.json(
      {
        success: true,
        message: "Join challenge data prepared",
        data: {
          participantPda: participantPda.toBase58(),
          participantBump,
          vaultPda: vaultPda.toBase58(),
          vaultBump,
          challengePda: challengePda.toBase58(),
          player: player.toBase58(),
          // Account metas for transaction building
          accounts: {
            player: body.player,
            challenge: challengePda.toBase58(),
            participant: participantPda.toBase58(),
            escrowVault: vaultPda.toBase58(),
            systemProgram: SystemProgram.programId.toBase58(),
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error joining challenge:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
