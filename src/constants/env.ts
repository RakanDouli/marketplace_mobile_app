/**
 * Environment Configuration for Shambay Mobile App
 *
 * Three environments:
 * - development: Local backend + Development Supabase
 * - staging: Hetzner backend + Staging Supabase
 * - production: api.shambay.com + Production Supabase
 */

// Get your computer's local IP for mobile testing
// Run: ipconfig getifaddr en0 (macOS)
const LOCAL_IP = '192.168.178.175'; // Update this to your IP

interface EnvironmentConfig {
  API_URL: string;
  GRAPHQL_URL: string;
  WS_URL: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  CLOUDFLARE_DOMAIN: string;
  CLOUDFLARE_ACCOUNT_HASH: string;
  APP_NAME: string;
  APP_VERSION: string;
}

const environments: Record<string, EnvironmentConfig> = {
  development: {
    API_URL: `http://${LOCAL_IP}:4000`,
    GRAPHQL_URL: `http://${LOCAL_IP}:4000/graphql`,
    WS_URL: `ws://${LOCAL_IP}:4000/ws`,
    SUPABASE_URL: 'https://hepesfbyhjydndmihvvv.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcGVzZmJ5aGp5ZG5kbWlodnZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzY4ODEsImV4cCI6MjA3MTYxMjg4MX0._gYmbus7Mn1JjWFKkeRGE_OnKUB3bSfluyiK2t25hR4',
    CLOUDFLARE_DOMAIN: 'imagedelivery.net',
    CLOUDFLARE_ACCOUNT_HASH: 'yvE6_nYkmBMTwQORcLcTkA',
    APP_NAME: 'Shambay Dev',
    APP_VERSION: '1.0.0',
  },

  staging: {
    API_URL: 'http://46.224.146.155:4000',
    GRAPHQL_URL: 'http://46.224.146.155:4000/graphql',
    WS_URL: 'ws://46.224.146.155:4000/ws',
    SUPABASE_URL: 'https://zokgmrriwhllyapgtuiu.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpva2dtcnJpd2hsbHlhcGd0dWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0NjI2OTIsImV4cCI6MjA0ODAzODY5Mn0.pDrzJzJPNF4HXRR7o5mZyYo-gnBJIp4RJVxAMJEr8Hs',
    CLOUDFLARE_DOMAIN: 'imagedelivery.net',
    CLOUDFLARE_ACCOUNT_HASH: 'yvE6_nYkmBMTwQORcLcTkA',
    APP_NAME: 'Shambay Staging',
    APP_VERSION: '1.0.0',
  },

  production: {
    API_URL: 'https://api.shambay.com',
    GRAPHQL_URL: 'https://api.shambay.com/graphql',
    WS_URL: 'wss://api.shambay.com/ws',
    SUPABASE_URL: 'https://vmnpvmsbmmjeiseowpju.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtbnB2bXNibW1qZWlzZW93cGp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0NjI5MTQsImV4cCI6MjA0ODAzODkxNH0.NcZtsCE5sKnPLdpD2PKgJQOG7dJj2JZU1KcGzJU-qLw',
    CLOUDFLARE_DOMAIN: 'imagedelivery.net',
    CLOUDFLARE_ACCOUNT_HASH: 'yvE6_nYkmBMTwQORcLcTkA',
    APP_NAME: 'Shambay',
    APP_VERSION: '1.0.0',
  },
};

// Select environment based on __DEV__ flag
// Change this to switch environments
const CURRENT_ENV: 'development' | 'staging' | 'production' = __DEV__
  ? 'development'  // Use development in dev mode
  : 'production';  // Use production in release builds

export const ENV = environments[CURRENT_ENV];

// Helper to check current environment
export const isDev = CURRENT_ENV === 'development';
export const isStaging = CURRENT_ENV === 'staging';
export const isProduction = CURRENT_ENV === 'production';

export default ENV;
