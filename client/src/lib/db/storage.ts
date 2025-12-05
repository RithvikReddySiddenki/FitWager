/**
 * Storage Layer for FitWager
 * 
 * Provides a unified interface for data storage.
 * Uses environment variable to switch between:
 * - Local file storage (development)
 * - Supabase (production)
 */

import { 
  User, 
  ChallengeMetadata, 
  ParticipantData, 
  FitnessVerification 
} from './schema';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// In-memory store for development
const memoryStore: {
  users: Map<string, User>;
  challenges: Map<string, ChallengeMetadata>;
  participants: Map<string, ParticipantData>;
  verifications: Map<string, FitnessVerification>;
} = {
  users: new Map(),
  challenges: new Map(),
  participants: new Map(),
  verifications: new Map(),
};

// File-based persistence for development
const DATA_DIR = path.join(process.cwd(), '.fitwager_data');
const CHALLENGES_FILE = path.join(DATA_DIR, 'challenges.json');

// Ensure data directory exists
function ensureDataDir() {
  if (typeof window !== 'undefined') return; // Skip in browser
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('Failed to create data directory:', err);
  }
}

// Load challenges from file
function loadChallengesFromFile() {
  if (typeof window !== 'undefined') return; // Skip in browser
  try {
    if (fs.existsSync(CHALLENGES_FILE)) {
      const data = fs.readFileSync(CHALLENGES_FILE, 'utf-8');
      const challenges = JSON.parse(data);
      memoryStore.challenges.clear();
      for (const challenge of challenges) {
        memoryStore.challenges.set(challenge.id, challenge);
      }
      console.log(`Loaded ${challenges.length} challenges from file`);
    }
  } catch (err) {
    console.error('Failed to load challenges from file:', err);
  }
}

// Save challenges to file
function saveChallengesFile() {
  if (typeof window !== 'undefined') return; // Skip in browser
  try {
    ensureDataDir();
    const challenges = Array.from(memoryStore.challenges.values());
    fs.writeFileSync(CHALLENGES_FILE, JSON.stringify(challenges, null, 2));
  } catch (err) {
    console.error('Failed to save challenges to file:', err);
  }
}

// Load challenges on module initialization
loadChallengesFromFile();

// Supabase client (initialized lazily)
let supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  if (supabase) return supabase;
  
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  
  if (url && key) {
    supabase = createClient(url, key);
    return supabase;
  }
  
  return null;
}

function isUsingSupabase(): boolean {
  return !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_KEY;
}

// ============================================================
// USER OPERATIONS
// ============================================================

export async function getUser(walletAddress: string): Promise<User | null> {
  if (isUsingSupabase()) {
    const client = getSupabaseClient();
    if (!client) return null;
    
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('id', walletAddress)
      .single();
    
    if (error || !data) return null;
    return data as User;
  }
  
  return memoryStore.users.get(walletAddress) || null;
}

export async function upsertUser(user: User): Promise<User> {
  const now = Date.now();
  const updatedUser = { ...user, updatedAt: now };
  
  if (isUsingSupabase()) {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not available');
    
    const { data, error } = await client
      .from('users')
      .upsert(updatedUser)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to upsert user: ${error.message}`);
    return data as User;
  }
  
  if (!memoryStore.users.has(user.id)) {
    updatedUser.createdAt = now;
  }
  memoryStore.users.set(user.id, updatedUser);
  return updatedUser;
}

export async function updateUserTokens(
  walletAddress: string, 
  tokens: {
    googleAccessToken: string;
    googleRefreshToken?: string;
    googleTokenExpiry: number;
  }
): Promise<User | null> {
  const user = await getUser(walletAddress);
  if (!user) return null;
  
  return upsertUser({
    ...user,
    ...tokens,
  });
}

// ============================================================
// CHALLENGE OPERATIONS
// ============================================================

export async function getChallenge(challengeId: string): Promise<ChallengeMetadata | null> {
  if (isUsingSupabase()) {
    const client = getSupabaseClient();
    if (!client) return null;
    
    const { data, error } = await client
      .from('competitions')
      .select('*')
      .eq('id', challengeId)
      .single();
    
    if (error || !data) return null;
    return normalizeCompetitionData(data) as ChallengeMetadata;
  }
  
  return memoryStore.challenges.get(challengeId) || null;
}

export async function upsertChallenge(challenge: ChallengeMetadata): Promise<ChallengeMetadata> {
  const now = Date.now();
  const updated = { ...challenge, updatedAt: now };
  
  if (isUsingSupabase()) {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not available');
    
    // Convert to Supabase schema (competitions table)
    const competitionData = denormalizeCompetitionData(updated);
    
    const { data, error } = await client
      .from('competitions')
      .upsert(competitionData)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to upsert challenge: ${error.message}`);
    return normalizeCompetitionData(data) as ChallengeMetadata;
  }
  
  if (!memoryStore.challenges.has(challenge.id)) {
    updated.createdAt = now;
  }
  memoryStore.challenges.set(challenge.id, updated);
  
  // Persist to file
  saveChallengesFile();
  
  console.log(`Challenge saved: ${challenge.id}`);
  return updated;
}

export async function listChallenges(filters?: {
  status?: string;
  isPublic?: boolean;
  creator?: string;
  participant?: string;
}): Promise<ChallengeMetadata[]> {
  if (isUsingSupabase()) {
    const client = getSupabaseClient();
    if (!client) return [];
    
    let query = client.from('competitions').select('*');
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.isPublic !== undefined) {
      query = query.eq('isPublic', filters.isPublic);
    }
    if (filters?.creator) {
      query = query.eq('creator', filters.creator);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error || !data) return [];
    return data.map(normalizeCompetitionData) as ChallengeMetadata[];
  }
  
  let challenges = Array.from(memoryStore.challenges.values());
  
  if (filters?.status) {
    challenges = challenges.filter(c => c.status === filters.status);
  }
  if (filters?.isPublic !== undefined) {
    challenges = challenges.filter(c => c.isPublic === filters.isPublic);
  }
  if (filters?.creator) {
    challenges = challenges.filter(c => c.creator === filters.creator);
  }
  
  return challenges.sort((a, b) => b.createdAt - a.createdAt);
}

// ============================================================
// PARTICIPANT OPERATIONS
// ============================================================

export async function getParticipant(
  challengeId: string, 
  wallet: string
): Promise<ParticipantData | null> {
  const id = `${challengeId}_${wallet}`;
  
  if (isUsingSupabase()) {
    const client = getSupabaseClient();
    if (!client) return null;
    
    const { data, error } = await client
      .from('participants')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return null;
    return data as ParticipantData;
  }
  
  return memoryStore.participants.get(id) || null;
}

export async function upsertParticipant(participant: ParticipantData): Promise<ParticipantData> {
  if (isUsingSupabase()) {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not available');
    
    const { data, error } = await client
      .from('participants')
      .upsert(participant)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to upsert participant: ${error.message}`);
    return data as ParticipantData;
  }
  
  memoryStore.participants.set(participant.id, participant);
  return participant;
}

export async function listParticipants(challengeId: string): Promise<ParticipantData[]> {
  if (isUsingSupabase()) {
    const client = getSupabaseClient();
    if (!client) return [];
    
    const { data, error } = await client
      .from('participants')
      .select('*')
      .eq('challengeId', challengeId)
      .order('score', { ascending: false });
    
    if (error || !data) return [];
    return data as ParticipantData[];
  }
  
  return Array.from(memoryStore.participants.values())
    .filter(p => p.challengeId === challengeId)
    .sort((a, b) => b.score - a.score);
}

// ============================================================
// VERIFICATION OPERATIONS
// ============================================================

export async function getVerification(
  challengeId: string, 
  wallet: string
): Promise<FitnessVerification | null> {
  const id = `${challengeId}_${wallet}`;
  
  if (isUsingSupabase()) {
    const client = getSupabaseClient();
    if (!client) return null;
    
    const { data, error } = await client
      .from('verifications')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return null;
    return data as FitnessVerification;
  }
  
  return memoryStore.verifications.get(id) || null;
}

export async function upsertVerification(
  verification: FitnessVerification
): Promise<FitnessVerification> {
  const id = `${verification.challengeId}_${verification.userId}`;
  
  if (isUsingSupabase()) {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not available');
    
    const { data, error } = await client
      .from('verifications')
      .upsert({ ...verification, id })
      .select()
      .single();
    
    if (error) throw new Error(`Failed to upsert verification: ${error.message}`);
    return data as FitnessVerification;
  }
  
  memoryStore.verifications.set(id, verification);
  return verification;
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

export async function getUserByGoogleId(googleId: string): Promise<User | null> {
  if (isUsingSupabase()) {
    const client = getSupabaseClient();
    if (!client) return null;
    
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('googleId', googleId)
      .single();
    
    if (error || !data) return null;
    return data as User;
  }
  
  for (const user of memoryStore.users.values()) {
    if (user.googleId === googleId) return user;
  }
  return null;
}

export async function getLeaderboard(challengeId: string): Promise<{
  wallet: string;
  score: number;
  rank: number;
}[]> {
  const participants = await listParticipants(challengeId);
  
  return participants
    .filter(p => p.hasJoined && p.hasSubmitted)
    .map((p, index) => ({
      wallet: p.wallet,
      score: p.score,
      rank: index + 1,
    }));
}

// ============================================================
// Supabase Schema Mapping Helpers
// ============================================================
// These functions convert between your internal schema (ChallengeMetadata)
// and the Supabase schema (competitions table)

/**
 * Convert Supabase 'competitions' table data to internal ChallengeMetadata format
 */
export function normalizeCompetitionData(data: any): ChallengeMetadata {
  return {
    id: data.id,
    title: data.name, // Supabase uses 'name' column
    description: data.description,
    creator: data.creator,
    challengeType: data.challenge_type || 'steps',
    goal: data.goal,
    entryFee: data.sol_amount, // Supabase uses 'sol_amount' column
    isUsdc: data.is_usdc || false,
    isPublic: data.is_public !== false, // Default to true
    startTime: data.start_time || Math.floor(Date.now() / 1000),
    endTime: data.end_time || Math.floor(Date.now() / 1000) + (data.duration_days || 7) * 86400,
    status: data.status || 'active',
    createdAt: new Date(data.created_at).getTime(),
    updatedAt: new Date(data.updated_at).getTime(),
  };
}

/**
 * Convert internal ChallengeMetadata to Supabase 'competitions' table format
 */
export function denormalizeCompetitionData(challenge: ChallengeMetadata): any {
  return {
    id: challenge.id,
    name: challenge.title, // Maps 'title' to 'name' column
    description: challenge.description,
    creator: challenge.creator,
    challenge_type: challenge.challengeType,
    goal: challenge.goal,
    sol_amount: challenge.entryFee, // Maps 'entryFee' to 'sol_amount' column
    is_usdc: challenge.isUsdc,
    is_public: challenge.isPublic,
    start_time: challenge.startTime,
    end_time: challenge.endTime,
    duration_days: Math.ceil((challenge.endTime - challenge.startTime) / 86400),
    status: challenge.status,
    created_at: new Date(challenge.createdAt).toISOString(),
    updated_at: new Date(challenge.updatedAt).toISOString(),
  };
}


