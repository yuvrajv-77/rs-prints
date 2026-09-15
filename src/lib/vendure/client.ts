import { GraphQLClient } from "graphql-request";

const endpoint = import.meta.env.PUBLIC_VENDURE_API_URL;

if (!endpoint) {
  throw new Error("PUBLIC_VENDURE_API_URL is not defined");
}

export const vendureClient = new GraphQLClient(endpoint, {
  credentials: "include",
});