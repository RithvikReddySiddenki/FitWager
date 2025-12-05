/**
 * Firebase/Firestore Database Layer for FitWager
 * 
 * A cloud database alternative to Supabase.
 * Uses Firestore for real-time, scalable data storage.
 * 
 * Perfect for multi-user deployments!
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  Firestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  QueryConstraint,
  Timestamp
} from 'firebase/firestore';
import { 
  User, 
  ChallengeMetadata, 
  ParticipantData, 
  FitnessVerification 
} from './schema';

// Firebase configuration
let app: FirebaseApp | null = null;
let db: Firestore | null = null;

function getFirebaseApp(): FirebaseApp {
  if (app) return app;
  
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  // Validate required config
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error('Firebase configuration is missing. Please set NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  }

  // Initialize Firebase (only if not already initialized)
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  return app;
}

function getDatabase(): Firestore {
  if (db) return db;
  
  const firebaseApp = getFirebaseApp();
  db = getFirestore(firebaseApp);
  
  console.log('[Firebase] Database initialized');
  return db;
}

// ============================================================
// USER OPERATIONS
// ============================================================

export async function getUser(walletAddress: string): Promise<User | null> {
  try {
    const database = getDatabase();
    const userRef = doc(database, 'users', walletAddress);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) return null;
    
    const data = userSnap.data();
    return {
      id: data.id,
      googleId: data.googleId || undefined,
      googleEmail: data.googleEmail || undefined,
      googleAccessToken: data.googleAccessToken || undefined,
      googleRefreshToken: data.googleRefreshToken || undefined,
      googleTokenExpiry: data.googleTokenExpiry || undefined,
      createdAt: data.createdAt || Date.now(),
      updatedAt: data.updatedAt || Date.now(),
    };
  } catch (error) {
    console.error('[Firebase] Error getting user:', error);
    return null;
  }
}

export async function upsertUser(user: User): Promise<User> {
  try {
    const database = getDatabase();
    const now = Date.now();
    const updatedUser = { ...user, updatedAt: now };
    
    const userRef = doc(database, 'users', user.id);
    const existing = await getUser(user.id);
    const createdAt = existing?.createdAt || now;
    
    await setDoc(userRef, {
      ...updatedUser,
      createdAt,
    }, { merge: true });
    
    return { ...updatedUser, createdAt };
  } catch (error) {
    console.error('[Firebase] Error upserting user:', error);
    throw error;
  }
}

// ============================================================
// CHALLENGE OPERATIONS
// ============================================================

export async function getChallenge(challengeId: string): Promise<ChallengeMetadata | null> {
  try {
    const database = getDatabase();
    const challengeRef = doc(database, 'competitions', challengeId);
    const challengeSnap = await getDoc(challengeRef);
    
    if (!challengeSnap.exists()) return null;
    
    const data = challengeSnap.data();
    return {
      id: data.id,
      title: data.name,
      description: data.description || undefined,
      creator: data.creator,
      challengeType: data.challenge_type,
      goal: data.goal,
      entryFee: data.sol_amount,
      isUsdc: data.is_usdc === true,
      isPublic: data.is_public !== false,
      startTime: data.start_time,
      endTime: data.end_time,
      status: data.status || 'active',
      createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
      updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : Date.now(),
    };
  } catch (error) {
    console.error('[Firebase] Error getting challenge:', error);
    return null;
  }
}

export async function upsertChallenge(challenge: ChallengeMetadata): Promise<ChallengeMetadata> {
  try {
    const database = getDatabase();
    const now = Date.now();
    const updated = { ...challenge, updatedAt: now };
    
    const challengeRef = doc(database, 'competitions', challenge.id);
    const existing = await getChallenge(challenge.id);
    const createdAt = existing?.createdAt || now;
    
    await setDoc(challengeRef, {
      id: updated.id,
      name: updated.title,
      description: updated.description || null,
      creator: updated.creator,
      challenge_type: updated.challengeType,
      goal: updated.goal,
      sol_amount: updated.entryFee,
      is_usdc: updated.isUsdc,
      is_public: updated.isPublic,
      start_time: updated.startTime,
      end_time: updated.endTime,
      duration_days: Math.ceil((updated.endTime - updated.startTime) / 86400),
      status: updated.status,
      created_at: new Date(createdAt).toISOString(),
      updated_at: new Date(updated.updatedAt).toISOString(),
    }, { merge: true });
    
    console.log('[Firebase] Challenge saved:', updated.id);
    return updated;
  } catch (error) {
    console.error('[Firebase] Error upserting challenge:', error);
    throw error;
  }
}

export async function listChallenges(filters?: {
  status?: string;
  isPublic?: boolean;
  creator?: string;
  participant?: string;
}): Promise<ChallengeMetadata[]> {
  try {
    const database = getDatabase();
    const competitionsRef = collection(database, 'competitions');
    
    const constraints: QueryConstraint[] = [];
    
    if (filters?.status) {
      constraints.push(where('status', '==', filters.status));
    }
    
    if (filters?.isPublic !== undefined) {
      constraints.push(where('is_public', '==', filters.isPublic));
    }
    
    if (filters?.creator) {
      constraints.push(where('creator', '==', filters.creator));
    }
    
    const q = query(competitionsRef, ...constraints);
    const querySnapshot = await getDocs(q);
    
    let challenges: ChallengeMetadata[] = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id,
        title: data.name,
        description: data.description || undefined,
        creator: data.creator,
        challengeType: data.challenge_type,
        goal: data.goal,
        entryFee: data.sol_amount,
        isUsdc: data.is_usdc === true,
        isPublic: data.is_public !== false,
        startTime: data.start_time,
        endTime: data.end_time,
        status: data.status || 'active',
        createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
        updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : Date.now(),
      } as ChallengeMetadata;
    });
    
    // Sort by created_at descending
    challenges.sort((a, b) => b.createdAt - a.createdAt);
    
    // Filter by participant if needed
    if (filters?.participant) {
      const participantChallenges: ChallengeMetadata[] = [];
      for (const challenge of challenges) {
        const participant = await getParticipant(challenge.id, filters.participant);
        if (participant?.hasJoined) {
          participantChallenges.push(challenge);
        }
      }
      challenges = participantChallenges;
    }
    
    return challenges;
  } catch (error) {
    console.error('[Firebase] Error listing challenges:', error);
    return [];
  }
}

// ============================================================
// PARTICIPANT OPERATIONS
// ============================================================

export async function getParticipant(
  challengeId: string, 
  wallet: string
): Promise<ParticipantData | null> {
  try {
    const database = getDatabase();
    const id = `${challengeId}_${wallet}`;
    const participantRef = doc(database, 'participants', id);
    const participantSnap = await getDoc(participantRef);
    
    if (!participantSnap.exists()) return null;
    
    const data = participantSnap.data();
    return {
      id: data.id,
      challengeId: data.challengeId,
      wallet: data.wallet,
      score: data.score || 0,
      hasJoined: data.hasJoined === true,
      hasSubmitted: data.hasSubmitted === true,
      joinedAt: data.joinedAt || undefined,
      lastVerification: data.lastVerification || undefined,
    };
  } catch (error) {
    console.error('[Firebase] Error getting participant:', error);
    return null;
  }
}

export async function upsertParticipant(participant: ParticipantData): Promise<ParticipantData> {
  try {
    const database = getDatabase();
    const participantRef = doc(database, 'participants', participant.id);
    
    await setDoc(participantRef, {
      id: participant.id,
      challengeId: participant.challengeId,
      wallet: participant.wallet,
      score: participant.score,
      hasJoined: participant.hasJoined,
      hasSubmitted: participant.hasSubmitted,
      joinedAt: participant.joinedAt || null,
      lastVerification: participant.lastVerification || null,
    }, { merge: true });
    
    return participant;
  } catch (error) {
    console.error('[Firebase] Error upserting participant:', error);
    throw error;
  }
}

export async function listParticipants(challengeId: string): Promise<ParticipantData[]> {
  try {
    const database = getDatabase();
    const participantsRef = collection(database, 'participants');
    const q = query(participantsRef, where('challengeId', '==', challengeId));
    const querySnapshot = await getDocs(q);
    
    const participants = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id,
        challengeId: data.challengeId,
        wallet: data.wallet,
        score: data.score || 0,
        hasJoined: data.hasJoined === true,
        hasSubmitted: data.hasSubmitted === true,
        joinedAt: data.joinedAt || undefined,
        lastVerification: data.lastVerification || undefined,
      };
    });
    
    // Sort by score descending
    participants.sort((a, b) => b.score - a.score);
    
    return participants;
  } catch (error) {
    console.error('[Firebase] Error listing participants:', error);
    return [];
  }
}

// ============================================================
// VERIFICATION OPERATIONS
// ============================================================

export async function getVerification(
  challengeId: string, 
  wallet: string
): Promise<FitnessVerification | null> {
  try {
    const database = getDatabase();
    const id = `${challengeId}_${wallet}`;
    const verificationRef = doc(database, 'verifications', id);
    const verificationSnap = await getDoc(verificationRef);
    
    if (!verificationSnap.exists()) return null;
    
    const data = verificationSnap.data();
    let rawData = {};
    try {
      rawData = typeof data.rawData === 'string' ? JSON.parse(data.rawData) : (data.rawData || {});
    } catch {}
    
    return {
      userId: data.userId,
      challengeId: data.challengeId,
      challengeType: data.challengeType,
      startTime: data.startTime,
      endTime: data.endTime,
      rawData: rawData,
      calculatedScore: data.calculatedScore,
      meetsGoal: data.meetsGoal === true,
      verifiedAt: data.verifiedAt,
      verificationHash: data.verificationHash || undefined,
    };
  } catch (error) {
    console.error('[Firebase] Error getting verification:', error);
    return null;
  }
}

export async function upsertVerification(
  verification: FitnessVerification
): Promise<FitnessVerification> {
  try {
    const database = getDatabase();
    const id = `${verification.challengeId}_${verification.userId}`;
    const verificationRef = doc(database, 'verifications', id);
    
    await setDoc(verificationRef, {
      id,
      userId: verification.userId,
      challengeId: verification.challengeId,
      challengeType: verification.challengeType,
      startTime: verification.startTime,
      endTime: verification.endTime,
      rawData: JSON.stringify(verification.rawData || {}),
      calculatedScore: verification.calculatedScore,
      meetsGoal: verification.meetsGoal,
      verifiedAt: verification.verifiedAt,
      verificationHash: verification.verificationHash || null,
    }, { merge: true });
    
    return verification;
  } catch (error) {
    console.error('[Firebase] Error upserting verification:', error);
    throw error;
  }
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

export async function getUserByGoogleId(googleId: string): Promise<User | null> {
  try {
    const database = getDatabase();
    const usersRef = collection(database, 'users');
    const q = query(usersRef, where('googleId', '==', googleId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return null;
    
    const data = querySnapshot.docs[0].data();
    return {
      id: data.id,
      googleId: data.googleId || undefined,
      googleEmail: data.googleEmail || undefined,
      googleAccessToken: data.googleAccessToken || undefined,
      googleRefreshToken: data.googleRefreshToken || undefined,
      googleTokenExpiry: data.googleTokenExpiry || undefined,
      createdAt: data.createdAt || Date.now(),
      updatedAt: data.updatedAt || Date.now(),
    };
  } catch (error) {
    console.error('[Firebase] Error getting user by Google ID:', error);
    return null;
  }
}

export async function getLeaderboard(challengeId: string): Promise<{
  wallet: string;
  score: number;
  rank: number;
}[]> {
  try {
    const participants = await listParticipants(challengeId);
    
    return participants
      .filter(p => p.hasJoined && p.hasSubmitted)
      .map((p, index) => ({
        wallet: p.wallet,
        score: p.score,
        rank: index + 1,
      }));
  } catch (error) {
    console.error('[Firebase] Error getting leaderboard:', error);
    return [];
  }
}
