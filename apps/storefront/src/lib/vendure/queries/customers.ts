import { vendureClient } from "../client";
import { graphql } from "../generated/gql";

export const GET_ACTIVE_CUSTOMER = graphql(`
  query GetActiveCustomer {
    activeCustomer {
      id
      title
      firstName
      lastName
      emailAddress
      phoneNumber
    }
  }
`);

export async function getActiveCustomer() {
  const data = await vendureClient.request(GET_ACTIVE_CUSTOMER);
  return data.activeCustomer;
}
