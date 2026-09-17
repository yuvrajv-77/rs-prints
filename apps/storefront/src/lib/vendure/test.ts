import { vendureClient } from "./client";
import { GET_PRODUCTS } from "./queries/queries";

export async function test() {
  const data = await vendureClient.request(GET_PRODUCTS);

  data.products;
  data.products.items;
  data.products.items[0].name;
}