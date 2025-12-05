/**
 * Google Fit API Client
 * 
 * Handles OAuth and fitness data fetching from Google Fit API
 */

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { GoogleFitData, ActivitySession } from '../db/schema';

// OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/google/callback';

// Required OAuth scopes for fitness data
export const GOOGLE_FIT_SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.location.read',
  'https://www.googleapis.com/auth/fitness.body.read',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

// Data source types
const DATA_SOURCES = {
  STEPS: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
  DISTANCE: 'derived:com.google.distance.delta:com.google.android.gms:merge_distance_delta',
  CALORIES: 'derived:com.google.calories.expended:com.google.android.gms:merge_calories_expended',
  ACTIVE_MINUTES: 'derived:com.google.active_minutes:com.google.android.gms:merge_active_minutes',
  ACTIVITY_SEGMENT: 'derived:com.google.activity.segment:com.google.android.gms:merge_activity_segments',
};

/**
 * Create OAuth2 client instance
 */
export function createOAuth2Client(): OAuth2Client {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

/**
 * Generate OAuth authorization URL
 */
export function getAuthorizationUrl(state?: string): string {
  const oauth2Client = createOAuth2Client();
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: GOOGLE_FIT_SCOPES,
    prompt: 'consent',
    state: state || '',
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiryDate: number;
}> {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  
  return {
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token,
    expiryDate: tokens.expiry_date || Date.now() + 3600000,
  };
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiryDate: number;
}> {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  
  const { credentials } = await oauth2Client.refreshAccessToken();
  
  return {
    accessToken: credentials.access_token!,
    expiryDate: credentials.expiry_date || Date.now() + 3600000,
  };
}

/**
 * Get user profile from Google
 */
export async function getUserProfile(accessToken: string): Promise<{
  id: string;
  email: string;
  name?: string;
}> {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();
  
  return {
    id: data.id!,
    email: data.email!,
    name: data.name || undefined,
  };
}

/**
 * Fetch fitness data from Google Fit
 */
export async function fetchFitnessData(
  accessToken: string,
  startTimeMs: number,
  endTimeMs: number
): Promise<GoogleFitData> {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  const fitness = google.fitness({ version: 'v1', auth: oauth2Client });
  
  // Fetch steps
  const steps = await fetchDataPoints(
    fitness,
    DATA_SOURCES.STEPS,
    startTimeMs,
    endTimeMs
  );
  
  // Fetch distance
  const distance = await fetchDataPoints(
    fitness,
    DATA_SOURCES.DISTANCE,
    startTimeMs,
    endTimeMs
  );
  
  // Fetch calories
  const calories = await fetchDataPoints(
    fitness,
    DATA_SOURCES.CALORIES,
    startTimeMs,
    endTimeMs
  );
  
  // Fetch active minutes
  const activeMinutes = await fetchDataPoints(
    fitness,
    DATA_SOURCES.ACTIVE_MINUTES,
    startTimeMs,
    endTimeMs
  );
  
  // Fetch activity sessions
  const activities = await fetchActivitySessions(
    fitness,
    startTimeMs,
    endTimeMs
  );
  
  return {
    steps: Math.round(steps),
    distance: Math.round(distance),
    calories: Math.round(calories),
    activeMinutes: Math.round(activeMinutes),
    activities,
    dataSource: 'google_fit',
    fetchedAt: Date.now(),
  };
}

/**
 * Fetch data points from a specific data source
 */
async function fetchDataPoints(
  fitness: ReturnType<typeof google.fitness>,
  dataSourceId: string,
  startTimeMs: number,
  endTimeMs: number
): Promise<number> {
  try {
    const response = await fitness.users.dataSources.datasets.get({
      userId: 'me',
      dataSourceId,
      datasetId: `${startTimeMs * 1000000}-${endTimeMs * 1000000}`,
    });
    
    let total = 0;
    const points = response.data.point || [];
    
    for (const point of points) {
      const values = point.value || [];
      for (const value of values) {
        if (value.intVal !== undefined) {
          total += value.intVal;
        } else if (value.fpVal !== undefined) {
          total += value.fpVal;
        }
      }
    }
    
    return total;
  } catch (error) {
    console.error(`Error fetching ${dataSourceId}:`, error);
    return 0;
  }
}

/**
 * Fetch activity sessions
 */
async function fetchActivitySessions(
  fitness: ReturnType<typeof google.fitness>,
  startTimeMs: number,
  endTimeMs: number
): Promise<ActivitySession[]> {
  try {
    const response = await fitness.users.sessions.list({
      userId: 'me',
      startTime: new Date(startTimeMs).toISOString(),
      endTime: new Date(endTimeMs).toISOString(),
    });
    
    const sessions = response.data.session || [];
    
    return sessions.map(session => ({
      name: session.name || 'Unknown Activity',
      startTime: parseInt(session.startTimeMillis || '0'),
      endTime: parseInt(session.endTimeMillis || '0'),
      duration: parseInt(session.endTimeMillis || '0') - parseInt(session.startTimeMillis || '0'),
      activityType: getActivityTypeName(session.activityType),
    }));
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }
}

/**
 * Map Google Fit activity type codes to names
 */
function getActivityTypeName(activityType?: number): string {
  const activityTypes: Record<number, string> = {
    0: 'In Vehicle',
    1: 'Biking',
    2: 'On Foot',
    7: 'Walking',
    8: 'Running',
    9: 'Aerobics',
    10: 'Badminton',
    11: 'Baseball',
    12: 'Basketball',
    13: 'Biathlon',
    14: 'Handbiking',
    15: 'Mountain Biking',
    16: 'Road Biking',
    17: 'Spinning',
    18: 'Stationary Biking',
    19: 'Utility Biking',
    20: 'Boxing',
    21: 'Calisthenics',
    22: 'Circuit Training',
    23: 'Cricket',
    24: 'Dancing',
    25: 'Elliptical',
    26: 'Fencing',
    27: 'Football (American)',
    28: 'Football (Australian)',
    29: 'Football (Soccer)',
    30: 'Frisbee',
    31: 'Gardening',
    32: 'Golf',
    33: 'Gymnastics',
    34: 'Handball',
    35: 'Hiking',
    36: 'Hockey',
    37: 'Horseback Riding',
    38: 'Housework',
    39: 'Jumping Rope',
    40: 'Kayaking',
    41: 'Kettlebell Training',
    42: 'Kickboxing',
    43: 'Kitesurfing',
    44: 'Martial Arts',
    45: 'Meditation',
    46: 'Mixed Martial Arts',
    47: 'P90X',
    48: 'Paragliding',
    49: 'Pilates',
    50: 'Polo',
    51: 'Racquetball',
    52: 'Rock Climbing',
    53: 'Rowing',
    54: 'Rowing Machine',
    55: 'Rugby',
    56: 'Jogging',
    57: 'Running on Sand',
    58: 'Treadmill Running',
    59: 'Sailing',
    60: 'Scuba Diving',
    61: 'Skateboarding',
    62: 'Skating',
    63: 'Cross Skating',
    64: 'Inline Skating',
    65: 'Skiing',
    66: 'Back-country Skiing',
    67: 'Cross-country Skiing',
    68: 'Downhill Skiing',
    69: 'Kite Skiing',
    70: 'Roller Skiing',
    71: 'Sledding',
    72: 'Sleeping',
    73: 'Snowboarding',
    74: 'Snowmobile',
    75: 'Snowshoeing',
    76: 'Squash',
    77: 'Stair Climbing',
    78: 'Stair Climbing Machine',
    79: 'Stand-up Paddleboarding',
    80: 'Strength Training',
    81: 'Surfing',
    82: 'Swimming',
    83: 'Pool Swimming',
    84: 'Open Water Swimming',
    85: 'Table Tennis',
    86: 'Team Sports',
    87: 'Tennis',
    88: 'Treadmill',
    89: 'Volleyball',
    90: 'Beach Volleyball',
    91: 'Indoor Volleyball',
    92: 'Wakeboarding',
    93: 'Walking',
    94: 'Fitness Walking',
    95: 'Nordic Walking',
    96: 'Treadmill Walking',
    97: 'Water Polo',
    98: 'Weightlifting',
    99: 'Wheelchair',
    100: 'Windsurfing',
    101: 'Yoga',
    102: 'Zumba',
    103: 'Diving',
    104: 'Ergometer',
    105: 'Ice Skating',
    106: 'Indoor Skating',
    108: 'Other',
    109: 'Light Sleep',
    110: 'Deep Sleep',
    111: 'REM Sleep',
    112: 'Awake',
    113: 'Biking',
    114: 'Hand Cycling',
    115: 'Interval Training',
    116: 'Wheelchair',
    117: 'HIIT',
    118: 'Swim',
    119: 'Cooldown',
  };
  
  return activityTypes[activityType || 108] || 'Unknown';
}

/**
 * Aggregate fitness data for a specific challenge timeframe
 */
export async function getChallengeFitnessData(
  accessToken: string,
  challengeStartTime: number,
  challengeEndTime: number
): Promise<GoogleFitData> {
  // If challenge end time is in the future, use current time
  const endTime = Math.min(challengeEndTime, Date.now());
  
  return fetchFitnessData(accessToken, challengeStartTime, endTime);
}

