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
  // Staging: Used for development and staging builds
  staging: {
    API_URL: 'https://staging-api.shambay.com',
    GRAPHQL_URL: 'https://staging-api.shambay.com/graphql',
    WS_URL: 'wss://staging-api.shambay.com/ws',
    WEB_URL: 'https://staging.shambay.com',
    SUPABASE_URL: 'https://zokgmrriwhllyapgtuiu.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpva2dtcnJpd2hsbHlhcGd0dWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MDg2NTQsImV4cCI6MjA4MTk4NDY1NH0.1fYgF_F3kOPrA4UjYjmCy0YE6zpsMtDTOEUA2-ZrjuE',
    CLOUDFLARE_DOMAIN: 'imagedelivery.net',
    CLOUDFLARE_ACCOUNT_HASH: 'yvE6_nYkmBMTwQORcLcTkA',
    APP_NAME: 'Shambay',
    APP_VERSION: '1.0.0',
  },

  // Production: Used for release builds (app store)
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

// Select environment based on __DEV__ flag
// - __DEV__ = true (development/staging builds) → staging
// - __DEV__ = false (production builds) → production
const CURRENT_ENV: Environment = __DEV__ ? 'staging' : 'production';

export const ENV = environments[CURRENT_ENV];

// Helper to check current environment
export const isStaging = CURRENT_ENV === 'staging';
export const isProduction = CURRENT_ENV === 'production';

export default ENV;
