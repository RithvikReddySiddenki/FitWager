import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { getParticipantPda } from "@/utils/pda";

interface SubmitScoreRequest {
  player: string;
  challengePda: string;
  score: number;
  workoutData?: {
    steps?: number;
    distance?: number;
    duration?: number;
    calories?: number;
    source?: string;
    timestamp?: number;
  };
}

interface WorkoutValidation {
  isValid: boolean;
  score: number;
  confidence: number;
  message?: string;
}

/**
 * Validate workout data
 * In production, this would verify against fitness APIs (Strava, Google Fit, Apple Health)
 */
function validateWorkout(workoutData?: SubmitScoreRequest["workoutData"]): WorkoutValidation {
  if (!workoutData) {
    return {
      isValid: false,
      score: 0,
      confidence: 0,
      message: "No workout data provided",
    };
  }

  // Basic validation - check for reasonable values
  if (workoutData.steps !== undefined) {
    if (workoutData.steps < 0 || workoutData.steps > 100000) {
      return {
        isValid: false,
        score: 0,
        confidence: 0,
        message: "Invalid step count",
      };
    }
    return {
      isValid: true,
      score: workoutData.steps,
      confidence: 0.85,
      message: "Steps validated",
    };
  }

  if (workoutData.distance !== undefined) {
    if (workoutData.distance < 0 || workoutData.distance > 100) {
      return {
        isValid: false,
        score: 0,
        confidence: 0,
        message: "Invalid distance",
      };
    }
    // Convert distance to score (e.g., meters)
    return {
      isValid: true,
      score: Math.floor(workoutData.distance * 1000),
      confidence: 0.9,
      message: "Distance validated",
    };
  }

  if (workoutData.duration !== undefined) {
    if (workoutData.duration < 0 || workoutData.duration > 86400) {
      return {
        isValid: false,
        score: 0,
        confidence: 0,
        message: "Invalid duration",
      };
    }
    // Convert duration to score (minutes)
    return {
      isValid: true,
      score: Math.floor(workoutData.duration / 60),
      confidence: 0.8,
      message: "Duration validated",
    };
  }

  return {
    isValid: true,
    score: workoutData.calories || 0,
    confidence: 0.7,
    message: "Generic workout data accepted",
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: SubmitScoreRequest = await request.json();

    // Validate input
    if (!body.player || !body.challengePda) {
      return NextResponse.json(
        { error: "Invalid input: player and challengePda are required" },
        { status: 400 }
      );
    }

    const player = new PublicKey(body.player);
    const challengePda = new PublicKey(body.challengePda);

    // Get participant PDA
    const [participantPda, participantBump] = getParticipantPda(challengePda, player);

    // Validate workout data
    const validation = validateWorkout(body.workoutData);
    
    // Use provided score or validated score
    const finalScore = body.score > 0 ? body.score : validation.score;

    if (finalScore <= 0) {
      return NextResponse.json(
        { error: "Invalid score: must be greater than 0" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Score submission data prepared",
        data: {
          participantPda: participantPda.toBase58(),
          participantBump,
          challengePda: challengePda.toBase58(),
          player: player.toBase58(),
          score: finalScore,
          validation: {
            isValid: validation.isValid,
            confidence: validation.confidence,
            message: validation.message,
          },
          workoutData: body.workoutData || null,
          // Account metas for transaction building
          accounts: {
            challenge: challengePda.toBase58(),
            participant: participantPda.toBase58(),
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error submitting score:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
