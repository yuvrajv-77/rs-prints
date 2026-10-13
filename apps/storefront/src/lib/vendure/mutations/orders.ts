import { vendureClient } from "../client";
import { graphql } from "../generated/gql";
import { useFragment } from "../generated/fragment-masking";
import { ACTIVE_ORDER_FRAGMENT, type ActiveOrder } from "../queries/orders";
import type { CreateAddressInput, CreateCustomerInput } from "../generated/graphql";

export type OrderActionResult = {
  order?: ActiveOrder;
  error?: string;
};

export const ADD_ITEM_TO_ORDER = graphql(`
  mutation AddItemToOrder($productVariantId: ID!, $quantity: Int!) {
    addItemToOrder(productVariantId: $productVariantId, quantity: $quantity) {
      ... on Order {
        ...ActiveOrderFields
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`);

export async function addItemToOrder(productVariantId: string, quantity: number): Promise<OrderActionResult> {
  const result = await vendureClient.request(ADD_ITEM_TO_ORDER, {
    productVariantId,
    quantity,
  });
  const res = result.addItemToOrder;
  if ("lines" in res || !("errorCode" in res)) {
    const order = useFragment(ACTIVE_ORDER_FRAGMENT, res as any);
    return { order: order as ActiveOrder };
  }
  return { error: ("message" in res && res.message) ? res.message : "Failed to add item to cart" };
}

export const ADJUST_ORDER_LINE = graphql(`
  mutation AdjustOrderLine($orderLineId: ID!, $quantity: Int!) {
    adjustOrderLine(orderLineId: $orderLineId, quantity: $quantity) {
      ... on Order {
        ...ActiveOrderFields
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`);

export async function adjustOrderLine(orderLineId: string, quantity: number): Promise<OrderActionResult> {
  const result = await vendureClient.request(ADJUST_ORDER_LINE, {
    orderLineId,
    quantity,
  });
  const res = result.adjustOrderLine;
  if ("lines" in res || !("errorCode" in res)) {
    const order = useFragment(ACTIVE_ORDER_FRAGMENT, res as any);
    return { order: order as ActiveOrder };
  }
  return { error: ("message" in res && res.message) ? res.message : "Failed to adjust item quantity" };
}

export const REMOVE_ORDER_LINE = graphql(`
  mutation RemoveOrderLine($orderLineId: ID!) {
    removeOrderLine(orderLineId: $orderLineId) {
      ... on Order {
        ...ActiveOrderFields
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`);

export async function removeOrderLine(orderLineId: string): Promise<OrderActionResult> {
  const result = await vendureClient.request(REMOVE_ORDER_LINE, {
    orderLineId,
  });
  const res = result.removeOrderLine;
  if ("lines" in res || !("errorCode" in res)) {
    const order = useFragment(ACTIVE_ORDER_FRAGMENT, res as any);
    return { order: order as ActiveOrder };
  }
  return { error: ("message" in res && res.message) ? res.message : "Failed to remove item from cart" };
}

export const APPLY_COUPON_CODE = graphql(`
  mutation ApplyCouponCode($couponCode: String!) {
    applyCouponCode(couponCode: $couponCode) {
      ... on Order {
        ...ActiveOrderFields
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`);

export async function applyCouponCode(couponCode: string): Promise<OrderActionResult> {
  const result = await vendureClient.request(APPLY_COUPON_CODE, {
    couponCode,
  });
  const res = result.applyCouponCode;
  if ("lines" in res || !("errorCode" in res)) {
    const order = useFragment(ACTIVE_ORDER_FRAGMENT, res as any);
    return { order: order as ActiveOrder };
  }
  return { error: ("message" in res && res.message) ? res.message : "Invalid or expired coupon code" };
}

export const REMOVE_COUPON_CODE = graphql(`
  mutation RemoveCouponCode($couponCode: String!) {
    removeCouponCode(couponCode: $couponCode) {
      ...ActiveOrderFields
    }
  }
`);

export async function removeCouponCode(couponCode: string): Promise<OrderActionResult> {
  const result = await vendureClient.request(REMOVE_COUPON_CODE, {
    couponCode,
  });
  const res = result.removeCouponCode;
  if (res) {
    const order = useFragment(ACTIVE_ORDER_FRAGMENT, res);
    return { order: order as ActiveOrder };
  }
  return { error: "Failed to remove coupon code" };
}

/* =========================================================================
 * CHECKOUT MUTATIONS
 * ========================================================================= */

export const SET_CUSTOMER_FOR_ORDER = graphql(`
  mutation SetCustomerForOrder($input: CreateCustomerInput!) {
    setCustomerForOrder(input: $input) {
      ... on Order {
        ...ActiveOrderFields
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`);

export async function setCustomerForOrder(input: CreateCustomerInput): Promise<OrderActionResult> {
  const result = await vendureClient.request(SET_CUSTOMER_FOR_ORDER, { input });
  const res = result.setCustomerForOrder;
  if ("lines" in res || !("errorCode" in res)) {
    const order = useFragment(ACTIVE_ORDER_FRAGMENT, res as any);
    return { order: order as ActiveOrder };
  }
  // If the customer is already logged in, Vendure returns AlreadyLoggedInError.
  // The active order is already tied to the authenticated customer, so ignore this safely.
  if (
    res.errorCode === "ALREADY_LOGGED_IN_ERROR" ||
    (res.message && res.message.toLowerCase().includes("already logged in"))
  ) {
    return {};
  }
  return { error: ("message" in res && res.message) ? res.message : "Failed to set customer details" };
}

export const SET_ORDER_SHIPPING_ADDRESS = graphql(`
  mutation SetOrderShippingAddress($input: CreateAddressInput!) {
    setOrderShippingAddress(input: $input) {
      ... on Order {
        ...ActiveOrderFields
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`);

export async function setOrderShippingAddress(input: CreateAddressInput): Promise<OrderActionResult> {
  const result = await vendureClient.request(SET_ORDER_SHIPPING_ADDRESS, { input });
  const res = result.setOrderShippingAddress;
  if ("lines" in res || !("errorCode" in res)) {
    const order = useFragment(ACTIVE_ORDER_FRAGMENT, res as any);
    return { order: order as ActiveOrder };
  }
  return { error: ("message" in res && res.message) ? res.message : "Failed to set shipping address" };
}

export const SET_ORDER_SHIPPING_METHOD = graphql(`
  mutation SetOrderShippingMethod($shippingMethodId: [ID!]!) {
    setOrderShippingMethod(shippingMethodId: $shippingMethodId) {
      ... on Order {
        ...ActiveOrderFields
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`);

export async function setOrderShippingMethod(shippingMethodId: string): Promise<OrderActionResult> {
  const result = await vendureClient.request(SET_ORDER_SHIPPING_METHOD, {
    shippingMethodId: [shippingMethodId],
  });
  const res = result.setOrderShippingMethod;
  if ("lines" in res || !("errorCode" in res)) {
    const order = useFragment(ACTIVE_ORDER_FRAGMENT, res as any);
    return { order: order as ActiveOrder };
  }
  return { error: ("message" in res && res.message) ? res.message : "Failed to select shipping method" };
}

export const TRANSITION_ORDER_TO_STATE = graphql(`
  mutation TransitionOrderToState($state: String!) {
    transitionOrderToState(state: $state) {
      ... on Order {
        ...ActiveOrderFields
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`);

export async function transitionOrderToState(state: string): Promise<OrderActionResult> {
  const result = await vendureClient.request(TRANSITION_ORDER_TO_STATE, { state });
  const res = result.transitionOrderToState;
  if (res && ("lines" in res || !("errorCode" in res))) {
    const order = useFragment(ACTIVE_ORDER_FRAGMENT, res as any);
    return { order: order as ActiveOrder };
  }
  return { error: (res && "message" in res && res.message) ? res.message : `Failed to transition order to ${state}` };
}

export const CREATE_RAZORPAY_ORDER = graphql(`
  mutation CreateRazorpayOrder {
    createRazorpayOrder {
      id
      amount
      currency
      keyId
    }
  }
`);

export async function createRazorpayOrder() {
  const result = await vendureClient.request(CREATE_RAZORPAY_ORDER);
  return result.createRazorpayOrder;
}

export const ADD_PAYMENT_TO_ORDER = graphql(`
  mutation AddPaymentToOrder($method: String!, $metadata: JSON!) {
    addPaymentToOrder(input: { method: $method, metadata: $metadata }) {
      ... on Order {
        ...ActiveOrderFields
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`);

export async function addPaymentToOrder(method: string, metadata: Record<string, any> = {}): Promise<OrderActionResult> {
  const result = await vendureClient.request(ADD_PAYMENT_TO_ORDER, {
    method,
    metadata,
  });
  const res = result.addPaymentToOrder;
  if (res && ("lines" in res || !("errorCode" in res))) {
    const order = useFragment(ACTIVE_ORDER_FRAGMENT, res as any);
    return { order: order as ActiveOrder };
  }
  return { error: (res && "message" in res && res.message) ? res.message : "Payment processing failed" };
}
