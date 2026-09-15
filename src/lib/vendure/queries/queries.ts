import { gql } from "graphql-request";

export const GET_PRODUCTS = gql`
  query GetProducts {
    products {
      items {
        id
        name
        slug
      }
    }
  }
`;