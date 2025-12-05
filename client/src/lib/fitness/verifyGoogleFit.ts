/**
 * Google Fit Verification Module
 * 
 * Verifies user fitness data against challenge requirements.
 * Produces deterministic scores ready for on-chain submission.
 */

import { createHash } from 'crypto';
import { 
  GoogleFitData, 
  FitnessVerification, 
  ChallengeType,
  ChallengeMetadata 
} from '../db/schema';
import { getChallengeFitnessData, refreshAccessToken } from './googleFitClient';
import { getUser, updateUserTokens, getChallenge } from '../db/storage';

interface VerificationResult {
  success: boolean;
  verification?: FitnessVerification;
  error?: string;
}

/**
 * Verify a user's fitness data for a specific challenge
 */
export async function verifyChallengeFitness(
  walletAddress: string,
  challengeId: string
): Promise<VerificationResult> {
  try {
    // Get user and their Google tokens
    const user = await getUser(walletAddress);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    if (!user.googleAccessToken) {
      return { success: false, error: 'Google Fit not connected' };
    }
    
    // Get challenge details
    const challenge = await getChallenge(challengeId);
    if (!challenge) {
      return { success: false, error: 'Challenge not found' };
    }
    
    // Check if token needs refresh
    let accessToken = user.googleAccessToken;
    if (user.googleTokenExpiry && user.googleTokenExpiry < Date.now()) {
      if (!user.googleRefreshToken) {
        return { success: false, error: 'Google token expired, please reconnect' };
      }
      
      try {
        const refreshed = await refreshAccessToken(user.googleRefreshToken);
        accessToken = refreshed.accessToken;
        await updateUserTokens(walletAddress, {
          googleAccessToken: refreshed.accessToken,
          googleTokenExpiry: refreshed.expiryDate,
        });
      } catch (error) {
        return { success: false, error: 'Failed to refresh Google token' };
      }
    }
    
    // Fetch fitness data for challenge timeframe
    const fitnessData = await getChallengeFitnessData(
      accessToken,
      challenge.startTime * 1000, // Convert to milliseconds
      challenge.endTime * 1000
    );
    
    // Calculate score based on challenge type
    const calculatedScore = calculateScore(fitnessData, challenge.challengeType, challenge.goal);
    const meetsGoal = checkGoalMet(calculatedScore, challenge.goal, challenge.challengeType);
    
    // Generate verification hash for on-chain submission
    const verificationHash = generateVerificationHash(
      walletAddress,
      challengeId,
      calculatedScore,
      fitnessData.fetchedAt
    );
    
    const verification: FitnessVerification = {
      userId: walletAddress,
      challengeId,
      challengeType: challenge.challengeType,
      startTime: challenge.startTime,
      endTime: challenge.endTime,
      rawData: fitnessData,
      calculatedScore,
      meetsGoal,
      verifiedAt: Date.now(),
      verificationHash,
    };
    
    return { success: true, verification };
  } catch (error) {
    console.error('Verification error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Verification failed' 
    };
  }
}

/**
 * Calculate score based on challenge type
 */
export function calculateScore(
  data: GoogleFitData,
  challengeType: ChallengeType,
  goal: number
): number {
  switch (challengeType) {
    case 'steps':
      // Score is the total steps achieved
      return data.steps || 0;
      
    case 'distance':
      // Score is distance in meters
      return data.distance || 0;
      
    case 'duration':
      // Score is total active minutes
      return data.activeMinutes || 0;
      
    case 'calories':
      // Score is total calories burned
      return data.calories || 0;
      
    default:
      return 0;
  }
}

/**
 * Check if the calculated score meets the challenge goal
 */
export function checkGoalMet(
  score: number,
  goal: number,
  challengeType: ChallengeType
): boolean {
  // For all challenge types, meeting the goal means achieving >= goal value
  return score >= goal;
}

/**
 * Calculate completion percentage
 */
export function calculateCompletionPercentage(
  score: number,
  goal: number
): number {
  if (goal <= 0) return 0;
  const percentage = (score / goal) * 100;
  return Math.min(Math.round(percentage * 10) / 10, 100); // Cap at 100%, one decimal
}

/**
 * Generate a deterministic verification hash
 * This hash is used to verify the score on-chain
 */
export function generateVerificationHash(
  walletAddress: string,
  challengeId: string,
  score: number,
  timestamp: number
): string {
  const secret = process.env.VERIFICATION_SECRET || 'fitwager-verification-secret';
  const data = `${walletAddress}:${challengeId}:${score}:${timestamp}:${secret}`;
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Convert verification hash to bytes for on-chain submission
 */
export function hashToBytes(hash: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < hash.length; i += 2) {
    bytes.push(parseInt(hash.slice(i, i + 2), 16));
  }
  return bytes;
}

/**
 * Get challenge-specific score label
 */
export function getScoreLabel(challengeType: ChallengeType): string {
  switch (challengeType) {
    case 'steps':
      return 'steps';
    case 'distance':
      return 'meters';
    case 'duration':
      return 'minutes';
    case 'calories':
      return 'calories';
    default:
      return 'points';
  }
}

/**
 * Format score for display
 */
export function formatScore(score: number, challengeType: ChallengeType): string {
  switch (challengeType) {
    case 'steps':
      return score.toLocaleString();
    case 'distance':
      // Convert meters to km if > 1000
      if (score >= 1000) {
        return `${(score / 1000).toFixed(2)} km`;
      }
      return `${score} m`;
    case 'duration':
      // Format as hours:minutes if > 60
      if (score >= 60) {
        const hours = Math.floor(score / 60);
        const mins = score % 60;
        return `${hours}h ${mins}m`;
      }
      return `${score} min`;
    case 'calories':
      return `${score.toLocaleString()} cal`;
    default:
      return score.toString();
  }
}

/**
 * Verify multiple participants for a challenge (for leaderboard calculation)
 */
export async function verifyAllParticipants(
  challengeId: string,
  participants: string[]
): Promise<Map<string, FitnessVerification>> {
  const results = new Map<string, FitnessVerification>();
  
  for (const wallet of participants) {
    const result = await verifyChallengeFitness(wallet, challengeId);
    if (result.success && result.verification) {
      results.set(wallet, result.verification);
    }
  }
  
  return results;
}

/**
 * Determine the winner based on verification results
 */
export function determineWinner(
  verifications: Map<string, FitnessVerification>
): string | null {
  let winnerWallet: string | null = null;
  let highestScore = -1;
  
  for (const [wallet, verification] of verifications) {
    if (verification.calculatedScore > highestScore) {
      highestScore = verification.calculatedScore;
      winnerWallet = wallet;
    }
  }
  
  return winnerWallet;
}

/**
 * Get verification summary for a challenge
 */
export interface VerificationSummary {
  totalParticipants: number;
  verifiedCount: number;
  goalMetCount: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  leader: string | null;
}

export function getVerificationSummary(
  verifications: Map<string, FitnessVerification>
): VerificationSummary {
  const scores: number[] = [];
  let goalMetCount = 0;
  let leader: string | null = null;
  let highestScore = 0;
  
  for (const [wallet, v] of verifications) {
    scores.push(v.calculatedScore);
    if (v.meetsGoal) goalMetCount++;
    if (v.calculatedScore > highestScore) {
      highestScore = v.calculatedScore;
      leader = wallet;
    }
  }
  
  return {
    totalParticipants: verifications.size,
    verifiedCount: scores.length,
    goalMetCount,
    averageScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
    highestScore,
    lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
    leader,
  };
}

