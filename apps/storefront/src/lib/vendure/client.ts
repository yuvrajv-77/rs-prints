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
 * Resolves the Vendure backend base origin (e.g. "http://localhost:3000" or "https://api.yourdomain.com").
 */
export function getVendureAssetBaseUrl(): string {
  const apiUrl =
    (typeof import.meta !== "undefined" && import.meta.env?.PUBLIC_VENDURE_API_URL) ||
    (typeof process !== "undefined" && (process.env?.PUBLIC_VENDURE_API_URL || process.env?.VENDURE_API_URL)) ||
    "http://localhost:3000/shop-api";

  try {
    const parsed = new URL(apiUrl);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return "http://localhost:3000";
  }
}

/**
 * Normalizes Vendure asset URLs:
 * 1. Converts relative paths ("/assets/preview/..." or "assets/preview/...") to absolute URLs pointing to the Vendure server.
 * 2. Rewrites "localhost:3000" to the configured public API origin or client network host so mobile devices & remote browsers can load images.
 * 3. Preserves external URLs (Cloudinary, Unsplash, S3, etc.) as-is.
 */
export function formatAssetUrl(url?: string | null): string {
  if (!url) return "";
  // Normalize Windows backslashes from Vendure path separators to standard URL slashes
  const clean = url.trim().replace(/\\/g, "/");
  if (!clean) return "";

  const baseOrigin = getVendureAssetBaseUrl();

  // If in browser and connected via local network IP (e.g. mobile testing on LAN 192.168.x.x)
  let resolvedOrigin = baseOrigin;
  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1" &&
    baseOrigin.includes("localhost")
  ) {
    resolvedOrigin = `${window.location.protocol}//${window.location.hostname}:3000`;
  }

  // Handle relative paths
  if (clean.startsWith("/")) {
    return `${resolvedOrigin}${clean}`;
  }
  if (clean.startsWith("assets/")) {
    return `${resolvedOrigin}/${clean}`;
  }

  // Handle localhost:3000 rewriting when target origin is different
  if (clean.startsWith("http://localhost:3000") && resolvedOrigin !== "http://localhost:3000") {
    return clean.replace("http://localhost:3000", resolvedOrigin);
  }

  return clean;
}

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

