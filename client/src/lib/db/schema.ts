/**
 * Database Schema Types for FitWager
 * 
 * This defines the data models for storing:
 * - User OAuth tokens (Google)
 * - Challenge metadata
 * - Participant data
 * - Fitness verification results
 */

export interface User {
  id: string;                    // Wallet public key
  googleId?: string;             // Google user ID
  googleEmail?: string;          // Google email
  googleAccessToken?: string;    // OAuth access token
  googleRefreshToken?: string;   // OAuth refresh token
  googleTokenExpiry?: number;    // Token expiry timestamp
  createdAt: number;             // Unix timestamp
  updatedAt: number;             // Unix timestamp
}

export interface ChallengeMetadata {
  id: string;                    // Challenge PDA (on-chain)
  title: string;                 // Human-readable title
  description?: string;          // Description
  creator: string;               // Creator wallet
  challengeType: ChallengeType;  // steps | distance | duration | calories
  goal: number;                  // Target value
  entryFee: number;              // Entry fee in lamports or USDC micro-units
  isUsdc: boolean;               // Payment type
  isPublic: boolean;             // Public visibility
  startTime: number;             // Unix timestamp
  endTime: number;               // Unix timestamp
  status: ChallengeStatus;       // active | ended | cancelled
  createdAt: number;
  updatedAt: number;
}

export interface ParticipantData {
  id: string;                    // `${challengeId}_${wallet}`
  challengeId: string;           // Challenge PDA
  wallet: string;                // Participant wallet
  score: number;                 // Current verified score
  hasJoined: boolean;
  hasSubmitted: boolean;
  joinedAt: number;
  lastVerification?: number;     // Last fitness data sync timestamp
  verificationData?: FitnessVerification;
}

export interface FitnessVerification {
  userId: string;                // User wallet
  challengeId: string;           // Challenge ID
  challengeType: ChallengeType;
  startTime: number;             // Verification window start
  endTime: number;               // Verification window end
  rawData: GoogleFitData;        // Raw data from Google Fit
  calculatedScore: number;       // Calculated score based on challenge type
  meetsGoal: boolean;            // Whether goal is met
  verifiedAt: number;            // Verification timestamp
  verificationHash: string;      // Hash for on-chain submission
}

export interface GoogleFitData {
  steps?: number;                // Total steps in period
  distance?: number;             // Distance in meters
  activeMinutes?: number;        // Active minutes
  calories?: number;             // Calories burned
  activities?: ActivitySession[];
  dataSource: string;            // Data source identifier
  fetchedAt: number;             // When data was fetched
}

export interface ActivitySession {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;              // Duration in milliseconds
  activityType: string;
  steps?: number;
  distance?: number;
  calories?: number;
}

export type ChallengeType = 'steps' | 'distance' | 'duration' | 'calories';
export type ChallengeStatus = 'active' | 'ended' | 'cancelled';

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface GoogleAuthResponse {
  authUrl: string;
}

export interface GoogleCallbackResponse {
  user: User;
  isNewUser: boolean;
}

export interface FitnessDataResponse {
  data: GoogleFitData;
  lastSynced: number;
}

export interface VerificationResponse {
  verification: FitnessVerification;
  readyForSubmission: boolean;
}

