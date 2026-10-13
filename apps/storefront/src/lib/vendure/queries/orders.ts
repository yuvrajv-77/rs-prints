import { vendureClient } from "../client";
import { graphql } from "../generated/gql";
import { useFragment } from "../generated/fragment-masking";
import type { ActiveOrderFieldsFragment } from "../generated/graphql";

export type ActiveOrder = ActiveOrderFieldsFragment;
export type ActiveOrderLine = ActiveOrderFieldsFragment["lines"][number];

export const ACTIVE_ORDER_FRAGMENT = graphql(`
  fragment ActiveOrderFields on Order {
    id
    code
    state
    active
    orderPlacedAt
    totalQuantity
    subTotal
    subTotalWithTax
    total
    totalWithTax
    shipping
    shippingWithTax
    couponCodes
    customer {
      id
      firstName
      lastName
      emailAddress
      phoneNumber
    }
    shippingAddress {
      fullName
      company
      streetLine1
      streetLine2
      city
      province
      postalCode
      country
      countryCode
      phoneNumber
    }
    shippingLines {
      id
      priceWithTax
      shippingMethod {
        id
        code
        name
        description
      }
    }
    discounts {
      description
      amount
      amountWithTax
    }
    lines {
      id
      quantity
      linePrice
      linePriceWithTax
      unitPrice
      unitPriceWithTax
      discountedUnitPriceWithTax
      featuredAsset {
        id
        preview
      }
      productVariant {
        id
        name
        sku
        price
        priceWithTax
        stockLevel
        featuredAsset {
          id
          preview
        }
        product {
          id
          name
          slug
          featuredAsset {
            id
            preview
          }
        }
        options {
          id
          code
          name
          group {
            id
            code
            name
          }
        }
      }
    }
  }
`);

export const GET_ACTIVE_ORDER = graphql(`
  query GetActiveOrder {
    activeOrder {
      ...ActiveOrderFields
    }
  }
`);

export const GET_ELIGIBLE_SHIPPING_METHODS = graphql(`
  query GetEligibleShippingMethods {
    eligibleShippingMethods {
      id
      name
      code
      description
      price
      priceWithTax
    }
  }
`);

export const GET_ELIGIBLE_PAYMENT_METHODS = graphql(`
  query GetEligiblePaymentMethods {
    eligiblePaymentMethods {
      id
      code
      name
      description
      isEligible
      eligibilityMessage
    }
  }
`);

export const GET_ORDER_BY_CODE = graphql(`
  query GetOrderByCode($code: String!) {
    orderByCode(code: $code) {
      ...ActiveOrderFields
      payments {
        id
        method
        amount
        state
        transactionId
        errorMessage
      }
    }
  }
`);

export const GET_CUSTOMER_ORDERS = graphql(`
  query GetCustomerOrders {
    activeCustomer {
      id
      orders {
        items {
          id
          code
          state
          orderPlacedAt
          totalQuantity
          totalWithTax
          lines {
            id
            quantity
            linePriceWithTax
            productVariant {
              id
              name
              sku
              featuredAsset {
                preview
              }
            }
          }
        }
        totalItems
      }
    }
  }
`);

export async function getActiveOrder(): Promise<ActiveOrder | null> {
  const result = await vendureClient.request(GET_ACTIVE_ORDER);
  if (!result.activeOrder) return null;
  return useFragment(ACTIVE_ORDER_FRAGMENT, result.activeOrder);
}

export async function getEligibleShippingMethods() {
  const result = await vendureClient.request(GET_ELIGIBLE_SHIPPING_METHODS);
  return result.eligibleShippingMethods || [];
}

export async function getEligiblePaymentMethods() {
  const result = await vendureClient.request(GET_ELIGIBLE_PAYMENT_METHODS);
  return result.eligiblePaymentMethods || [];
}

export async function getOrderByCode(code: string) {
  const result = await vendureClient.request(GET_ORDER_BY_CODE, { code });
  if (!result.orderByCode) return null;
  return {
    ...useFragment(ACTIVE_ORDER_FRAGMENT, result.orderByCode),
    payments: result.orderByCode.payments || [],
  };
}

export async function getCustomerOrders() {
  const result = await vendureClient.request(GET_CUSTOMER_ORDERS);
  return result.activeCustomer?.orders?.items || [];
}
