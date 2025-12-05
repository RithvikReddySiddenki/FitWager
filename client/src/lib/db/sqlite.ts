/**
 * SQLite Database Layer for FitWager
 * 
 * A simple, local database alternative to Supabase.
 * Uses SQLite for better querying than JSON files.
 * 
 * No external service needed - everything is local!
 */

import fs from 'fs';
import path from 'path';
import { 
  User, 
  ChallengeMetadata, 
  ParticipantData, 
  FitnessVerification,
  GoogleFitData
} from './schema';

// Lazy load better-sqlite3 to avoid bundling issues
let Database: any = null;

function getDatabaseClass() {
  if (typeof window !== 'undefined') {
    throw new Error('SQLite can only be used server-side');
  }
  
  if (!Database) {
    try {
      Database = require('better-sqlite3');
    } catch (error) {
      console.error('[SQLite] Failed to load better-sqlite3:', error);
      throw new Error('better-sqlite3 is not available. Make sure it is installed: npm install better-sqlite3');
    }
  }
  
  return Database;
}

// Database file location
const DATA_DIR = path.join(process.cwd(), '.fitwager_data');
const DB_FILE = path.join(DATA_DIR, 'fitwager.db');

// Ensure data directory exists
function ensureDataDir() {
  if (typeof window !== 'undefined') return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('Failed to create data directory:', err);
  }
}

// Initialize database
let db: any = null;

function getDatabase(): any {
  if (db) return db;
  
  try {
    const Database = getDatabaseClass();
    ensureDataDir();
    db = new Database(DB_FILE);
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    
    // Create tables if they don't exist
    initializeTables(db);
    
    console.log('[SQLite] Database initialized:', DB_FILE);
    return db;
  } catch (error) {
    console.error('[SQLite] Failed to initialize database:', error);
    throw error;
  }
}

function initializeTables(database: any) {
  // Users table
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      googleId TEXT,
      googleEmail TEXT,
      googleAccessToken TEXT,
      googleRefreshToken TEXT,
      googleTokenExpiry INTEGER,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    )
  `);

  // Competitions (challenges) table
  database.exec(`
    CREATE TABLE IF NOT EXISTS competitions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      creator TEXT NOT NULL,
      challenge_type TEXT NOT NULL,
      goal REAL NOT NULL,
      sol_amount REAL NOT NULL,
      is_usdc INTEGER DEFAULT 0,
      is_public INTEGER DEFAULT 1,
      start_time INTEGER NOT NULL,
      end_time INTEGER NOT NULL,
      duration_days INTEGER,
      status TEXT DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  
  // Create index for faster queries
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_competitions_status ON competitions(status);
    CREATE INDEX IF NOT EXISTS idx_competitions_public ON competitions(is_public);
    CREATE INDEX IF NOT EXISTS idx_competitions_creator ON competitions(creator);
  `);

  // Participants table
  database.exec(`
    CREATE TABLE IF NOT EXISTS participants (
      id TEXT PRIMARY KEY,
      challengeId TEXT NOT NULL,
      wallet TEXT NOT NULL,
      score REAL DEFAULT 0,
      hasJoined INTEGER DEFAULT 0,
      hasSubmitted INTEGER DEFAULT 0,
      joinedAt INTEGER,
      lastVerification INTEGER,
      FOREIGN KEY (challengeId) REFERENCES competitions(id)
    )
  `);

  // Verifications table
  database.exec(`
    CREATE TABLE IF NOT EXISTS verifications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      challengeId TEXT NOT NULL,
      challengeType TEXT NOT NULL,
      startTime INTEGER NOT NULL,
      endTime INTEGER NOT NULL,
      calculatedScore REAL NOT NULL,
      meetsGoal INTEGER DEFAULT 0,
      verifiedAt INTEGER NOT NULL,
      verificationHash TEXT,
      rawData TEXT,
      FOREIGN KEY (challengeId) REFERENCES competitions(id)
    )
  `);

  // Create indexes for better performance
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_participants_challenge ON participants(challengeId);
    CREATE INDEX IF NOT EXISTS idx_verifications_challenge ON verifications(challengeId);
  `);

  console.log('[SQLite] Tables initialized');
}

// ============================================================
// USER OPERATIONS
// ============================================================

export function getUser(walletAddress: string): User | null {
  try {
    const database = getDatabase();
    const row = database.prepare('SELECT * FROM users WHERE id = ?').get(walletAddress) as any;
    
    if (!row) return null;
    
    return {
      id: row.id,
      googleId: row.googleId || undefined,
      googleEmail: row.googleEmail || undefined,
      googleAccessToken: row.googleAccessToken || undefined,
      googleRefreshToken: row.googleRefreshToken || undefined,
      googleTokenExpiry: row.googleTokenExpiry || undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  } catch (error) {
    console.error('[SQLite] Error getting user:', error);
    return null;
  }
}

export function upsertUser(user: User): User {
  try {
    const database = getDatabase();
    const now = Date.now();
    const updatedUser = { ...user, updatedAt: now };
    
    const stmt = database.prepare(`
      INSERT INTO users (id, googleId, googleEmail, googleAccessToken, googleRefreshToken, googleTokenExpiry, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        googleId = excluded.googleId,
        googleEmail = excluded.googleEmail,
        googleAccessToken = excluded.googleAccessToken,
        googleRefreshToken = excluded.googleRefreshToken,
        googleTokenExpiry = excluded.googleTokenExpiry,
        updatedAt = excluded.updatedAt
    `);
    
    const existing = getUser(user.id);
    const createdAt = existing?.createdAt || now;
    
    stmt.run(
      updatedUser.id,
      updatedUser.googleId || null,
      updatedUser.googleEmail || null,
      updatedUser.googleAccessToken || null,
      updatedUser.googleRefreshToken || null,
      updatedUser.googleTokenExpiry || null,
      createdAt,
      updatedUser.updatedAt
    );
    
    return { ...updatedUser, createdAt };
  } catch (error) {
    console.error('[SQLite] Error upserting user:', error);
    throw error;
  }
}

// ============================================================
// CHALLENGE OPERATIONS
// ============================================================

export function getChallenge(challengeId: string): ChallengeMetadata | null {
  try {
    const database = getDatabase();
    const row = database.prepare('SELECT * FROM competitions WHERE id = ?').get(challengeId) as any;
    
    if (!row) return null;
    
    return {
      id: row.id,
      title: row.name,
      description: row.description || undefined,
      creator: row.creator,
      challengeType: row.challenge_type,
      goal: row.goal,
      entryFee: row.sol_amount,
      isUsdc: row.is_usdc === 1,
      isPublic: row.is_public !== 0,
      startTime: row.start_time,
      endTime: row.end_time,
      status: row.status,
      createdAt: new Date(row.created_at).getTime(),
      updatedAt: new Date(row.updated_at).getTime(),
    };
  } catch (error) {
    console.error('[SQLite] Error getting challenge:', error);
    return null;
  }
}

export function upsertChallenge(challenge: ChallengeMetadata): ChallengeMetadata {
  try {
    const database = getDatabase();
    const now = Date.now();
    const updated = { ...challenge, updatedAt: now };
    
    const stmt = database.prepare(`
      INSERT INTO competitions (
        id, name, description, creator, challenge_type, goal, sol_amount, 
        is_usdc, is_public, start_time, end_time, duration_days, status, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        challenge_type = excluded.challenge_type,
        goal = excluded.goal,
        sol_amount = excluded.sol_amount,
        is_usdc = excluded.is_usdc,
        is_public = excluded.is_public,
        start_time = excluded.start_time,
        end_time = excluded.end_time,
        duration_days = excluded.duration_days,
        status = excluded.status,
        updated_at = excluded.updated_at
    `);
    
    const existing = getChallenge(challenge.id);
    const createdAt = existing?.createdAt || now;
    const durationDays = Math.ceil((updated.endTime - updated.startTime) / 86400);
    
    stmt.run(
      updated.id,
      updated.title,
      updated.description || null,
      updated.creator,
      updated.challengeType,
      updated.goal,
      updated.entryFee,
      updated.isUsdc ? 1 : 0,
      updated.isPublic ? 1 : 0,
      updated.startTime,
      updated.endTime,
      durationDays,
      updated.status,
      new Date(createdAt).toISOString(),
      new Date(updated.updatedAt).toISOString()
    );
    
    console.log('[SQLite] Challenge saved:', updated.id);
    return updated;
  } catch (error) {
    console.error('[SQLite] Error upserting challenge:', error);
    throw error;
  }
}

export function listChallenges(filters?: {
  status?: string;
  isPublic?: boolean;
  creator?: string;
  participant?: string;
}): ChallengeMetadata[] {
  try {
    const database = getDatabase();
    
    let query = 'SELECT * FROM competitions WHERE 1=1';
    const params: any[] = [];
    
    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    
    if (filters?.isPublic !== undefined) {
      query += ' AND is_public = ?';
      params.push(filters.isPublic ? 1 : 0);
    }
    
    if (filters?.creator) {
      query += ' AND creator = ?';
      params.push(filters.creator);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const rows = database.prepare(query).all(...params) as any[];
    
    let challenges: ChallengeMetadata[] = rows.map(row => ({
      id: row.id,
      title: row.name,
      description: row.description || undefined,
      creator: row.creator,
      challengeType: row.challenge_type,
      goal: row.goal,
      entryFee: row.sol_amount,
      isUsdc: row.is_usdc === 1,
      isPublic: row.is_public !== 0,
      startTime: row.start_time,
      endTime: row.end_time,
      status: row.status,
      createdAt: new Date(row.created_at).getTime(),
      updatedAt: new Date(row.updated_at).getTime(),
    } as ChallengeMetadata));
    
    // Filter by participant if needed
    if (filters?.participant) {
      const participantChallenges: ChallengeMetadata[] = [];
      for (const challenge of challenges) {
        const participant = getParticipant(challenge.id, filters.participant);
        if (participant?.hasJoined) {
          participantChallenges.push(challenge);
        }
      }
      challenges = participantChallenges;
    }
    
    return challenges;
  } catch (error) {
    console.error('[SQLite] Error listing challenges:', error);
    return [];
  }
}

// ============================================================
// PARTICIPANT OPERATIONS
// ============================================================

export function getParticipant(
  challengeId: string, 
  wallet: string
): ParticipantData | null {
  try {
    const database = getDatabase();
    const id = `${challengeId}_${wallet}`;
    const row = database.prepare('SELECT * FROM participants WHERE id = ?').get(id) as any;
    
    if (!row) return null;
    
    return {
      id: row.id,
      challengeId: row.challengeId,
      wallet: row.wallet,
      score: row.score,
      hasJoined: row.hasJoined === 1,
      hasSubmitted: row.hasSubmitted === 1,
      joinedAt: row.joinedAt,
      lastVerification: row.lastVerification || undefined,
    };
  } catch (error) {
    console.error('[SQLite] Error getting participant:', error);
    return null;
  }
}

export function upsertParticipant(participant: ParticipantData): ParticipantData {
  try {
    const database = getDatabase();
    
    const stmt = database.prepare(`
      INSERT INTO participants (id, challengeId, wallet, score, hasJoined, hasSubmitted, joinedAt, lastVerification)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        score = excluded.score,
        hasJoined = excluded.hasJoined,
        hasSubmitted = excluded.hasSubmitted,
        joinedAt = excluded.joinedAt,
        lastVerification = excluded.lastVerification
    `);
    
    stmt.run(
      participant.id,
      participant.challengeId,
      participant.wallet,
      participant.score,
      participant.hasJoined ? 1 : 0,
      participant.hasSubmitted ? 1 : 0,
      participant.joinedAt,
      participant.lastVerification || null
    );
    
    return participant;
  } catch (error) {
    console.error('[SQLite] Error upserting participant:', error);
    throw error;
  }
}

export function listParticipants(challengeId: string): ParticipantData[] {
  try {
    const database = getDatabase();
    const rows = database.prepare(`
      SELECT * FROM participants 
      WHERE challengeId = ? 
      ORDER BY score DESC
    `).all(challengeId) as any[];
    
    return rows.map(row => ({
      id: row.id,
      challengeId: row.challengeId,
      wallet: row.wallet,
      score: row.score,
      hasJoined: row.hasJoined === 1,
      hasSubmitted: row.hasSubmitted === 1,
      joinedAt: row.joinedAt,
      lastVerification: row.lastVerification || undefined,
    }));
  } catch (error) {
    console.error('[SQLite] Error listing participants:', error);
    return [];
  }
}

// ============================================================
// VERIFICATION OPERATIONS
// ============================================================

export function getVerification(
  challengeId: string, 
  wallet: string
): FitnessVerification | null {
  try {
    const database = getDatabase();
    const id = `${challengeId}_${wallet}`;
    const row = database.prepare('SELECT * FROM verifications WHERE id = ?').get(id) as any;
    
    if (!row) return null;
    
    // Note: rawData is stored as JSON string, need to parse it
    let rawData: GoogleFitData | null = null;
    try {
      rawData = JSON.parse(row.rawData || '{}');
    } catch {}
    
    return {
      userId: row.userId,
      challengeId: row.challengeId,
      challengeType: row.challengeType,
      startTime: row.startTime,
      endTime: row.endTime,
      rawData: rawData || {},
      calculatedScore: row.calculatedScore,
      meetsGoal: row.meetsGoal === 1,
      verifiedAt: row.verifiedAt,
      verificationHash: row.verificationHash || undefined,
    };
  } catch (error) {
    console.error('[SQLite] Error getting verification:', error);
    return null;
  }
}

export function upsertVerification(
  verification: FitnessVerification
): FitnessVerification {
  try {
    const database = getDatabase();
    const id = `${verification.challengeId}_${verification.userId}`;
    
    const stmt = database.prepare(`
      INSERT INTO verifications (
        id, userId, challengeId, challengeType, startTime, endTime, 
        calculatedScore, meetsGoal, verifiedAt, verificationHash, rawData
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        calculatedScore = excluded.calculatedScore,
        meetsGoal = excluded.meetsGoal,
        verifiedAt = excluded.verifiedAt,
        verificationHash = excluded.verificationHash,
        rawData = excluded.rawData
    `);
    
    stmt.run(
      id,
      verification.userId,
      verification.challengeId,
      verification.challengeType,
      verification.startTime,
      verification.endTime,
      verification.calculatedScore,
      verification.meetsGoal ? 1 : 0,
      verification.verifiedAt,
      verification.verificationHash || null,
      JSON.stringify(verification.rawData || {})
    );
    
    return verification;
  } catch (error) {
    console.error('[SQLite] Error upserting verification:', error);
    throw error;
  }
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

export function getUserByGoogleId(googleId: string): User | null {
  try {
    const database = getDatabase();
    const row = database.prepare('SELECT * FROM users WHERE googleId = ?').get(googleId) as any;
    
    if (!row) return null;
    
    return {
      id: row.id,
      googleId: row.googleId || undefined,
      googleEmail: row.googleEmail || undefined,
      googleAccessToken: row.googleAccessToken || undefined,
      googleRefreshToken: row.googleRefreshToken || undefined,
      googleTokenExpiry: row.googleTokenExpiry || undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  } catch (error) {
    console.error('[SQLite] Error getting user by Google ID:', error);
    return null;
  }
}

export function getLeaderboard(challengeId: string): {
  wallet: string;
  score: number;
  rank: number;
}[] {
  try {
    const participants = listParticipants(challengeId);
    
    return participants
      .filter(p => p.hasJoined && p.hasSubmitted)
      .map((p, index) => ({
        wallet: p.wallet,
        score: p.score,
        rank: index + 1,
      }));
  } catch (error) {
    console.error('[SQLite] Error getting leaderboard:', error);
    return [];
  }
}
