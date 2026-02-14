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

// Simple in-memory cache for GraphQL responses
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();

/**
 * Make a cached GraphQL request
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
    return cached.data;
  }

  // Make request
  const data = await graphqlRequest<T>(document, variables);

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

export default graphqlClient;
