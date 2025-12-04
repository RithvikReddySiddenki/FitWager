import { NextRequest, NextResponse } from "next/server";
import { PublicKey, SystemProgram, SYSVAR_CLOCK_PUBKEY } from "@solana/web3.js";
import { getChallengePda, getVaultPda } from "@/utils/pda";
import { solToLamports } from "@/utils/solana";

// In-memory storage for challenge metadata (use database in production)
const challengeMetadata: Map<string, ChallengeMetadata> = new Map();

interface ChallengeMetadata {
  id: string;
  creator: string;
  title: string;
  description?: string;
  type?: string;
  goal?: number;
  isPublic: boolean;
  createdAt: number;
}

interface CreateChallengeRequest {
  creator: string;
  entryFee: number; // in SOL
  durationDays: number;
  title?: string;
  description?: string;
  type?: string;
  goal?: number;
  isPublic?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateChallengeRequest = await request.json();

    // Validate input
    if (!body.creator || body.entryFee <= 0 || body.durationDays <= 0) {
      return NextResponse.json(
        { error: "Invalid input: creator, entryFee, and durationDays are required" },
        { status: 400 }
      );
    }

    const creator = new PublicKey(body.creator);
    const entryFeeLamports = solToLamports(body.entryFee);
    const durationSeconds = body.durationDays * 24 * 60 * 60;

    // Get PDAs
    const now = Math.floor(Date.now() / 1000);
    const [challengePda, challengeBump] = getChallengePda(creator, now);
    const [vaultPda, vaultBump] = getVaultPda(challengePda);

    // Store metadata
    const metadata: ChallengeMetadata = {
      id: challengePda.toBase58(),
      creator: body.creator,
      title: body.title || `Challenge by ${body.creator.slice(0, 8)}...`,
      description: body.description,
      type: body.type,
      goal: body.goal,
      isPublic: body.isPublic ?? false,
      createdAt: now,
    };
    challengeMetadata.set(challengePda.toBase58(), metadata);

    // Return transaction data for client to sign
    return NextResponse.json(
      {
        success: true,
        message: "Challenge creation data prepared",
        data: {
          challengePda: challengePda.toBase58(),
          challengeBump,
          vaultPda: vaultPda.toBase58(),
          vaultBump,
          entryFeeLamports,
          durationSeconds,
          timestamp: now,
          metadata,
          // Account metas for transaction building
          accounts: {
            creator: body.creator,
            challenge: challengePda.toBase58(),
            escrowVault: vaultPda.toBase58(),
            systemProgram: SystemProgram.programId.toBase58(),
            clock: SYSVAR_CLOCK_PUBKEY.toBase58(),
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating challenge:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Export for use in list endpoint
export { challengeMetadata };
