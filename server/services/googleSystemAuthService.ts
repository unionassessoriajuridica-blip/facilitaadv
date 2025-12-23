import { google } from 'googleapis';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.VITE_GOOGLE_CLIENT_SECRET;

const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

interface GoogleCredentials {
  id?: string;
  service_type: string;
  access_token: string;
  refresh_token: string;
  token_expiry: string;
  scopes: string[];
  email: string;
  connected_at?: string;
  connected_by?: string;
  updated_at?: string;
  is_active: boolean;
  metadata?: any;
}

let cachedCredentials: GoogleCredentials | null = null;
let lastFetchTime: number = 0;
const CACHE_TTL = 60000;

function getOAuth2Client(redirectUri?: string) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth credentials not configured');
  }
  
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    redirectUri
  );
}

export function getAuthUrl(redirectUri: string): string {
  const oauth2Client = getOAuth2Client(redirectUri);
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  });
}

export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<{
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  email: string;
}> {
  const oauth2Client = getOAuth2Client(redirectUri);
  
  const { tokens } = await oauth2Client.getToken(code);
  
  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Failed to get tokens from Google');
  }
  
  oauth2Client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const userInfo = await oauth2.userinfo.get();
  
  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date || Date.now() + 3600000,
    email: userInfo.data.email || 'unknown',
  };
}

async function getStoredCredentials(): Promise<GoogleCredentials | null> {
  if (cachedCredentials && (Date.now() - lastFetchTime) < CACHE_TTL) {
    return cachedCredentials;
  }
  
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.warn('Supabase credentials not configured');
    return null;
  }
  
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/google_system_credentials?service_type=eq.google_unified&is_active=eq.true&limit=1`,
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      }
    );
    
    if (!response.ok) {
      console.error('Failed to fetch Google credentials:', response.status);
      return null;
    }
    
    const data = await response.json();
    if (data && data.length > 0) {
      cachedCredentials = data[0];
      lastFetchTime = Date.now();
      return cachedCredentials;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching Google credentials:', error);
    return null;
  }
}

async function saveCredentials(credentials: Partial<GoogleCredentials>): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Supabase credentials not configured');
    return false;
  }
  
  try {
    const existingCreds = await getStoredCredentials();
    
    const url = existingCreds
      ? `${SUPABASE_URL}/rest/v1/google_system_credentials?id=eq.${existingCreds.id}`
      : `${SUPABASE_URL}/rest/v1/google_system_credentials`;
    
    const method = existingCreds ? 'PATCH' : 'POST';
    
    const payload = {
      ...credentials,
      service_type: 'google_unified',
      updated_at: new Date().toISOString(),
    };
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      console.error('Failed to save Google credentials:', response.status);
      return false;
    }
    
    cachedCredentials = null;
    lastFetchTime = 0;
    
    return true;
  } catch (error) {
    console.error('Error saving Google credentials:', error);
    return false;
  }
}

async function refreshAccessToken(credentials: GoogleCredentials): Promise<string | null> {
  if (!credentials.refresh_token) {
    console.error('No refresh token available');
    return null;
  }
  
  try {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
      refresh_token: credentials.refresh_token,
    });
    
    const { credentials: newTokens } = await oauth2Client.refreshAccessToken();
    
    if (!newTokens.access_token) {
      console.error('Failed to refresh access token');
      return null;
    }
    
    await saveCredentials({
      access_token: newTokens.access_token,
      token_expiry: new Date(newTokens.expiry_date || Date.now() + 3600000).toISOString(),
    });
    
    return newTokens.access_token;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return null;
  }
}

export async function getAccessToken(): Promise<string> {
  const credentials = await getStoredCredentials();
  
  if (!credentials) {
    throw new Error('Google integration not connected. Please connect Google in settings.');
  }
  
  const expiryTime = new Date(credentials.token_expiry).getTime();
  const now = Date.now();
  const bufferTime = 5 * 60 * 1000;
  
  if (expiryTime - now < bufferTime) {
    console.log('Access token expired or expiring soon, refreshing...');
    const newToken = await refreshAccessToken(credentials);
    if (newToken) {
      return newToken;
    }
    throw new Error('Failed to refresh Google access token. Please reconnect.');
  }
  
  return credentials.access_token;
}

export async function isConnected(): Promise<boolean> {
  try {
    const credentials = await getStoredCredentials();
    return credentials !== null && credentials.is_active;
  } catch {
    return false;
  }
}

export async function getConnectionStatus(): Promise<{
  connected: boolean;
  email?: string;
  connectedAt?: string;
  scopes?: string[];
}> {
  const credentials = await getStoredCredentials();
  
  if (!credentials) {
    return { connected: false };
  }
  
  return {
    connected: credentials.is_active,
    email: credentials.email,
    connectedAt: credentials.connected_at,
    scopes: credentials.scopes,
  };
}

export async function connect(
  accessToken: string,
  refreshToken: string,
  expiryDate: number,
  email: string,
  userId?: string
): Promise<boolean> {
  return saveCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    token_expiry: new Date(expiryDate).toISOString(),
    scopes: SCOPES,
    email,
    connected_at: new Date().toISOString(),
    connected_by: userId,
    is_active: true,
  });
}

export async function disconnect(): Promise<boolean> {
  const credentials = await getStoredCredentials();
  
  if (!credentials) {
    return true;
  }
  
  try {
    if (credentials.access_token) {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${credentials.access_token}`, {
        method: 'POST',
      });
    }
  } catch (error) {
    console.warn('Failed to revoke token:', error);
  }
  
  const success = await saveCredentials({
    is_active: false,
    access_token: '',
    refresh_token: '',
  });
  
  cachedCredentials = null;
  lastFetchTime = 0;
  
  return success;
}

export async function getOAuth2ClientWithToken(): Promise<InstanceType<typeof google.auth.OAuth2>> {
  const accessToken = await getAccessToken();
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  return oauth2Client;
}

export const googleSystemAuthService = {
  getAuthUrl,
  exchangeCodeForTokens,
  getAccessToken,
  isConnected,
  getConnectionStatus,
  connect,
  disconnect,
  getOAuth2ClientWithToken,
};
