import { GraphQLClient } from "graphql-request";

const AUTH_TOKEN_KEY = "vendure_auth_token";

/**
 * Retrieve the active Vendure auth token from localStorage (client-side only).
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Persist or remove the Vendure auth token in localStorage.
 */
export function setAuthToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch {
    // Ignore storage errors (e.g. private browsing storage quota/restrictions)
  }
}

/**
 * Remove the Vendure auth token upon sign out.
 */
export function clearAuthToken(): void {
  setAuthToken(null);
}

/**
 * Vendure Shop API GraphQL Endpoint
 * Reads the public environment variable `PUBLIC_VENDURE_API_URL` (configured for production/staging)
 * and falls back to local server at `http://localhost:3000/shop-api` in development.
 */
const endpoint =
  import.meta.env.PUBLIC_VENDURE_API_URL || "http://localhost:3000/shop-api";

/**
 * Shared GraphQL Client instance (`graphql-request`)
 *
 * Configured with:
 * - `credentials: "include"`: preserves session cookies when on the same root domain.
 * - `headers`: dynamically attaches the Bearer token from localStorage for bulletproof
 *   cross-domain authentication (Safari ITP & Chrome cross-site cookie restrictions).
 * - `responseMiddleware`: captures the `vendure-auth-token` header emitted by Vendure
 *   on customer login, registration, and active cart sessions.
 */
export const vendureClient = new GraphQLClient(endpoint, {
  credentials: "include",
  headers: () => {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
  responseMiddleware: (response) => {
    if (typeof window === "undefined") return;
    if (!(response instanceof Error) && response.headers) {
      const token = response.headers.get("vendure-auth-token");
      if (token) {
        setAuthToken(token);
      }
    }
  },
});

