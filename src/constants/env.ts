/**
 * Environment Configuration for Shambay Mobile App
 *
 * Two environments (matching frontend pattern):
 * - staging: For development + staging builds (__DEV__ = true)
 * - production: For production/release builds (__DEV__ = false)
 */

interface EnvironmentConfig {
  API_URL: string;
  GRAPHQL_URL: string;
  WS_URL: string;
  WEB_URL: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  CLOUDFLARE_DOMAIN: string;
  CLOUDFLARE_ACCOUNT_HASH: string;
  APP_NAME: string;
  APP_VERSION: string;
}

const environments: Record<string, EnvironmentConfig> = {
  // Staging: Used for development (Expo Go) and preview builds
  // Points to Hetzner staging server (port 4001)
  staging: {
    API_URL: 'http://46.224.146.155:4001',
    GRAPHQL_URL: 'http://46.224.146.155:4001/graphql',
    WS_URL: 'ws://46.224.146.155:4001/ws',
    WEB_URL: 'https://staging.shambay.com',
    SUPABASE_URL: 'https://zokgmrriwhllyapgtuiu.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpva2dtcnJpd2hsbHlhcGd0dWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MDg2NTQsImV4cCI6MjA4MTk4NDY1NH0.1fYgF_F3kOPrA4UjYjmCy0YE6zpsMtDTOEUA2-ZrjuE',
    CLOUDFLARE_DOMAIN: 'imagedelivery.net',
    CLOUDFLARE_ACCOUNT_HASH: 'yvE6_nYkmBMTwQORcLcTkA',
    APP_NAME: 'Shambay',
    APP_VERSION: '1.0.0',
  },

  // Production: Used for release builds (app store)
  // Points to api.shambay.com (same as web frontend)
  production: {
    API_URL: 'https://api.shambay.com',
    GRAPHQL_URL: 'https://api.shambay.com/graphql',
    WS_URL: 'wss://api.shambay.com/ws',
    WEB_URL: 'https://shambay.com',
    SUPABASE_URL: 'https://vmnpvmsbmmjeiseowpju.supabase.co',
    // Updated to match frontend .env.production
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtbnB2bXNibW1qZWlzZW93cGp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MDg0NDIsImV4cCI6MjA4MTk4NDQ0Mn0.d6WqeWJvPb9UVeC7BuJ5u5pHZJ0AtLh5hiXKX5YnZj0',
    CLOUDFLARE_DOMAIN: 'imagedelivery.net',
    CLOUDFLARE_ACCOUNT_HASH: 'yvE6_nYkmBMTwQORcLcTkA',
    APP_NAME: 'Shambay',
    APP_VERSION: '1.0.0',
  },
};

// Environment type
type Environment = 'staging' | 'production';

// Determine environment:
// 1. Expo Go (development): __DEV__ = true → staging
// 2. Preview build: EXPO_PUBLIC_APP_ENV = staging → staging
// 3. Production build: EXPO_PUBLIC_APP_ENV = production → production
const getEnvironment = (): Environment => {
  // Check if running in Expo Go (development mode)
  // Expo Go always has __DEV__ = true
  if (__DEV__) {
    console.log('[ENV] Running in Expo Go/Development → using staging');
    return 'staging';
  }

  // For EAS builds, check EXPO_PUBLIC_APP_ENV from eas.json
  // @ts-ignore - EXPO_PUBLIC_APP_ENV is injected by EAS build
  const appEnv = process.env.EXPO_PUBLIC_APP_ENV;

  if (appEnv === 'staging') {
    console.log('[ENV] EAS build with staging profile → using staging');
    return 'staging';
  }

  if (appEnv === 'production') {
    console.log('[ENV] EAS build with production profile → using production');
    return 'production';
  }

  // Fallback: if __DEV__ is false and no EXPO_PUBLIC_APP_ENV, assume production
  console.log('[ENV] Fallback → using production');
  return 'production';
};

const CURRENT_ENV: Environment = getEnvironment();

export const ENV = environments[CURRENT_ENV];

// Helper to check current environment
export const isStaging = CURRENT_ENV === 'staging';
export const isProduction = CURRENT_ENV === 'production';

export default ENV;
