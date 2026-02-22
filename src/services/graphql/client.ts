/**
 * GraphQL Client for Shambay Mobile App
 * Uses graphql-request library for simple GraphQL requests
 */

import { GraphQLClient, RequestDocument, Variables } from 'graphql-request';
import { ENV } from '../../constants/env';
import { getAccessToken } from '../supabase';

// Create GraphQL client
const graphqlClient = new GraphQLClient(ENV.GRAPHQL_URL, {
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Make an authenticated GraphQL request
 * Automatically adds Authorization header if user is logged in
 */
export async function graphqlRequest<T = any>(
  document: RequestDocument,
  variables?: Variables,
  requireAuth: boolean = false
): Promise<T> {
  try {
    // Get access token if available
    const token = await getAccessToken();

    // Check if auth is required but not available
    if (requireAuth && !token) {
      throw new Error('Authentication required');
    }

    // Set headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Make request
    graphqlClient.setHeaders(headers);
    const result = await graphqlClient.request<T>(document, variables);

    return result;
  } catch (error: any) {
    // Handle GraphQL errors
    if (error.response?.errors) {
      const firstError = error.response.errors[0];
      throw new Error(firstError.message || 'GraphQL request failed');
    }

    // Handle network errors
    if (error.message?.includes('Network request failed')) {
      throw new Error('Unable to connect to server. Please check your internet connection.');
    }

    throw error;
  }
}

/**
 * Make a public GraphQL request (no authentication)
 */
export async function publicGraphqlRequest<T = any>(
  document: RequestDocument,
  variables?: Variables
): Promise<T> {
  return graphqlRequest<T>(document, variables, false);
}

/**
 * Make an authenticated GraphQL request (requires login)
 */
export async function authGraphqlRequest<T = any>(
  document: RequestDocument,
  variables?: Variables
): Promise<T> {
  return graphqlRequest<T>(document, variables, true);
}

// LRU Cache with size limit for GraphQL responses
// Prevents memory leaks by limiting cache size and evicting oldest entries
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const MAX_CACHE_SIZE = 100; // Maximum number of cache entries
const cache = new Map<string, CacheEntry<any>>();

/**
 * LRU eviction - removes oldest entries when cache exceeds limit
 * Uses Map insertion order (oldest first) for efficient LRU
 */
function evictOldestIfNeeded(): void {
  if (cache.size >= MAX_CACHE_SIZE) {
    // Remove oldest 20% of entries to avoid frequent evictions
    const entriesToRemove = Math.ceil(MAX_CACHE_SIZE * 0.2);
    const keys = Array.from(cache.keys()).slice(0, entriesToRemove);
    keys.forEach((key) => cache.delete(key));
  }
}

/**
 * Move entry to end of Map (most recently used)
 * This maintains LRU order where oldest entries are first
 */
function touchCacheEntry(key: string, entry: CacheEntry<any>): void {
  cache.delete(key);
  cache.set(key, entry);
}

/**
 * Make a cached GraphQL request with LRU eviction
 * @param document GraphQL document
 * @param variables Query variables
 * @param ttl Cache time-to-live in milliseconds (default: 1 minute)
 */
export async function cachedGraphqlRequest<T = any>(
  document: RequestDocument,
  variables?: Variables,
  ttl: number = 60000
): Promise<T> {
  // Generate cache key from document and variables
  const cacheKey = JSON.stringify({ document, variables });

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < ttl) {
    // Move to end (most recently used)
    touchCacheEntry(cacheKey, cached);
    return cached.data;
  }

  // Remove expired entry if exists
  if (cached) {
    cache.delete(cacheKey);
  }

  // Make request
  const data = await graphqlRequest<T>(document, variables);

  // Evict oldest entries if needed before adding new one
  evictOldestIfNeeded();

  // Store in cache
  cache.set(cacheKey, { data, timestamp: Date.now() });

  return data;
}

/**
 * Clear the GraphQL cache
 */
export function clearGraphqlCache(): void {
  cache.clear();
}

/**
 * Clear specific cache entry
 */
export function clearCacheEntry(document: RequestDocument, variables?: Variables): void {
  const cacheKey = JSON.stringify({ document, variables });
  cache.delete(cacheKey);
}

/**
 * Get current cache size (for debugging)
 */
export function getCacheSize(): number {
  return cache.size;
}

export default graphqlClient;
