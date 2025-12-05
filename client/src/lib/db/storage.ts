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
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single();
    
    if (error || !data) return null;
    return data as ChallengeMetadata;
  }
  
  return memoryStore.challenges.get(challengeId) || null;
}

export async function upsertChallenge(challenge: ChallengeMetadata): Promise<ChallengeMetadata> {
  const now = Date.now();
  const updated = { ...challenge, updatedAt: now };
  
  if (isUsingSupabase()) {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not available');
    
    const { data, error } = await client
      .from('challenges')
      .upsert(updated)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to upsert challenge: ${error.message}`);
    return data as ChallengeMetadata;
  }
  
  if (!memoryStore.challenges.has(challenge.id)) {
    updated.createdAt = now;
  }
  memoryStore.challenges.set(challenge.id, updated);
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
    
    let query = client.from('challenges').select('*');
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.isPublic !== undefined) {
      query = query.eq('isPublic', filters.isPublic);
    }
    if (filters?.creator) {
      query = query.eq('creator', filters.creator);
    }
    
    const { data, error } = await query.order('createdAt', { ascending: false });
    
    if (error || !data) return [];
    return data as ChallengeMetadata[];
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

