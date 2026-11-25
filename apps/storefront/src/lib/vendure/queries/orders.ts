import { vendureClient, formatAssetUrl } from "../client";
import { graphql } from "../generated/gql";
import { useFragment } from "../generated/fragment-masking";
import type { ActiveOrderFieldsFragment } from "../generated/graphql";

export type OrderLineCustomFields = {
  customizationId?: string | null;
  customizationData?: string | null;
};

export type ActiveOrderLine = ActiveOrderFieldsFragment["lines"][number] & {
  customFields?: OrderLineCustomFields | null;
};

export type ActiveOrder = Omit<ActiveOrderFieldsFragment, "lines"> & {
  lines: ActiveOrderLine[];
};

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
      orders(options: { sort: { createdAt: DESC } }) {
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
            featuredAsset {
              id
              preview
            }
            productVariant {
              id
              name
              sku
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
            }
          }
        }
        totalItems
      }
    }
  }
`);

const GET_CUSTOMER_ORDERS_WITH_CUSTOM_FIELDS = `
  query GetCustomerOrdersWithCustomFields {
    activeCustomer {
      id
      orders(options: { sort: { createdAt: DESC } }) {
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
            customFields {
              customizationId
              customizationData
            }
            featuredAsset {
              id
              preview
            }
            productVariant {
              id
              name
              sku
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
            }
          }
        }
        totalItems
      }
    }
  }
`;

const GET_ORDER_BY_CODE_WITH_CUSTOM_FIELDS = `
  query GetOrderByCodeWithCustomFields($code: String!) {
    orderByCode(code: $code) {
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
        customFields {
          customizationId
          customizationData
        }
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
`;

export const ACTIVE_ORDER_WITH_CUSTOM_FIELDS_QUERY = `
  query GetActiveOrderWithCustomFields {
    activeOrder {
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
        customFields {
          customizationId
          customizationData
        }
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
  }
`;

let orderLineCustomFieldsQuerySupported: boolean | null = null;

export async function getActiveOrder(): Promise<ActiveOrder | null> {
  if (orderLineCustomFieldsQuerySupported !== false) {
    try {
      const result = await vendureClient.request<{ activeOrder?: ActiveOrder | null }>(
        ACTIVE_ORDER_WITH_CUSTOM_FIELDS_QUERY
      );
      orderLineCustomFieldsQuerySupported = true;
      return result.activeOrder ?? null;
    } catch (err: any) {
      const msg = String(err?.message || "");
      if (msg.includes("customFields") || msg.includes("customizationId")) {
        orderLineCustomFieldsQuerySupported = false;
      } else {
        throw err;
      }
    }
  }

  const result = await vendureClient.request(GET_ACTIVE_ORDER);
  if (!result.activeOrder) return null;
  return useFragment(ACTIVE_ORDER_FRAGMENT, result.activeOrder) as ActiveOrder;
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
  if (orderLineCustomFieldsQuerySupported !== false) {
    try {
      const result = await vendureClient.request<{ orderByCode?: any }>(
        GET_ORDER_BY_CODE_WITH_CUSTOM_FIELDS,
        { code }
      );
      orderLineCustomFieldsQuerySupported = true;
      if (!result.orderByCode) return null;
      return {
        ...result.orderByCode,
        payments: result.orderByCode.payments || [],
      };
    } catch (err: any) {
      const msg = String(err?.message || "");
      if (msg.includes("customFields") || msg.includes("customizationId")) {
        orderLineCustomFieldsQuerySupported = false;
      } else {
        throw err;
      }
    }
  }

  const result = await vendureClient.request(GET_ORDER_BY_CODE, { code });
  if (!result.orderByCode) return null;
  return {
    ...useFragment(ACTIVE_ORDER_FRAGMENT, result.orderByCode),
    payments: result.orderByCode.payments || [],
  };
}

export async function getCustomerOrders() {
  if (orderLineCustomFieldsQuerySupported !== false) {
    try {
      const result = await vendureClient.request<{
        activeCustomer?: { orders?: { items?: any[] } } | null;
      }>(GET_CUSTOMER_ORDERS_WITH_CUSTOM_FIELDS);
      orderLineCustomFieldsQuerySupported = true;
      return result.activeCustomer?.orders?.items || [];
    } catch (err: any) {
      const msg = String(err?.message || "");
      if (msg.includes("customFields") || msg.includes("customizationId")) {
        orderLineCustomFieldsQuerySupported = false;
      } else {
        throw err;
      }
    }
  }

  const result = await vendureClient.request(GET_CUSTOMER_ORDERS);
  return result.activeCustomer?.orders?.items || [];
}

/**
 * Resolves the best display image URL for an order line item, preferring any saved
 * customization mockup preview, then line/variant/product Vendure featured assets.
 */
export function resolveOrderLineImageUrl(line: {
  customFields?: { customizationData?: string | null } | null;
  featuredAsset?: { preview?: string | null } | null;
  productVariant?: {
    featuredAsset?: { preview?: string | null } | null;
    product?: { featuredAsset?: { preview?: string | null } | null } | null;
  } | null;
}): string {
  const rawJson = line?.customFields?.customizationData;
  if (rawJson) {
    try {
      const parsed = JSON.parse(rawJson);
      const customPreview =
        parsed?.front?.previewAssetUrl ||
        parsed?.front?.previewDataUrl ||
        parsed?.back?.previewAssetUrl ||
        parsed?.back?.previewDataUrl;
      if (customPreview) {
        return customPreview.startsWith("data:") ? customPreview : formatAssetUrl(customPreview);
      }
    } catch {
      // Ignore invalid JSON
    }
  }

  const rawAsset =
    line?.featuredAsset?.preview ||
    line?.productVariant?.featuredAsset?.preview ||
    line?.productVariant?.product?.featuredAsset?.preview ||
    "";

  return rawAsset ? formatAssetUrl(rawAsset) : "";
}
