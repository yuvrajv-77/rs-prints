import { GraphQLClient } from "graphql-request";

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
 * Configured with `credentials: "include"`:
 * - Essential for sending and receiving session cookies (such as auth tokens or active cart/order sessions)
 *   across cross-origin requests between the storefront and Vendure backend.
 */
export const vendureClient = new GraphQLClient(endpoint, {
  credentials: "include",
});
