import { graphql } from "../generated/gql";

export const GET_PRODUCTS = graphql(`
  query GetProducts {
    products {
      items {
        id
        name
        slug
      }
    }
  }
`);