import { vendureClient } from "../client";
import { graphql } from "../generated/gql";

export const REGISTER_CUSTOMER = graphql(`
  mutation RegisterCustomer(
    $input: RegisterCustomerInput!
  ) {
    registerCustomerAccount(input: $input) {
      ... on Success {
        success
      }

      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`);

export async function registerCustomer(input: {
  emailAddress: string;
  password: string;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  title?: string | null;
}) {
  return vendureClient.request(REGISTER_CUSTOMER, {
    input,
  });
}

export const LOGIN = graphql(`
  mutation Login(
    $username: String!
    $password: String!
    $rememberMe: Boolean
  ) {
    login(username: $username, password: $password, rememberMe: $rememberMe) {
      ... on CurrentUser {
        id
        identifier
      }

      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`);

export async function loginCustomer(variables: {
  username: string;
  password: string;
  rememberMe?: boolean;
}) {
  return vendureClient.request(LOGIN, variables);
}

export const LOGOUT = graphql(`
  mutation Logout {
    logout {
      success
    }
  }
`);

export async function logoutCustomer() {
  return vendureClient.request(LOGOUT);
}

export const UPDATE_CUSTOMER = graphql(`
  mutation UpdateCustomer($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      id
      title
      firstName
      lastName
      phoneNumber
      emailAddress
    }
  }
`);

export async function updateCustomerProfile(input: {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  title?: string;
}) {
  return vendureClient.request(UPDATE_CUSTOMER, {
    input,
  });
}