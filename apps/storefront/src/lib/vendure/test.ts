import { vendureClient } from "./client";
import { GET_PRODUCTS } from "./queries/products";

/**
 * Test helper for verifying GraphQL queries and type inference against Vendure.
 * Queries the Shop API for products and exercises TypeScript autocompletion on returned items.
 */
export async function test() {
  const data = await vendureClient.request(GET_PRODUCTS);

  data.products;
  data.products.items;
  data.products.items[0]?.name;
}