import { atom, computed } from "nanostores";
import { getActiveOrder, type ActiveOrder, type ActiveOrderLine } from "@/lib/vendure/queries/orders";
import {
  addItemToOrder,
  adjustOrderLine,
  removeOrderLine,
  applyCouponCode,
  removeCouponCode,
} from "@/lib/vendure/mutations/orders";
import { toast } from "@/components/ui/toast";

export type { ActiveOrder, ActiveOrderLine };

export interface CartState {
  order: ActiveOrder | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
}

// 1. Reactive Cart State Atom
export const $cart = atom<CartState>({
  order: null,
  loading: false,
  initialized: false,
  error: null,
});

// 2. Computed values for zero-latency UI reads
export const $cartCount = computed($cart, (state) => state.order?.totalQuantity ?? 0);

export const $cartSubtotal = computed($cart, (state) => {
  const amount = state.order?.subTotalWithTax;
  return typeof amount === "number" ? amount : 0;
});

export const $cartTotal = computed($cart, (state) => {
  const amount = state.order?.totalWithTax;
  return typeof amount === "number" ? amount : 0;
});

export const $cartLines = computed($cart, (state) => state.order?.lines ?? []);

/**
 * Fetch the active order from Vendure.
 * Called on mount in header or cart views to hydrate cart session.
 */
export async function fetchActiveOrder(): Promise<ActiveOrder | null> {
  const current = $cart.get();
  // Avoid duplicate fetches while already in-flight
  if (current.loading) return current.order;

  $cart.set({
    ...current,
    loading: true,
  });

  try {
    const order = await getActiveOrder();
    $cart.set({
      order: order ?? null,
      loading: false,
      initialized: true,
      error: null,
    });
    return order;
  } catch (err: any) {
    console.error("Failed to fetch active order from Vendure:", err);
    $cart.set({
      ...$cart.get(),
      loading: false,
      initialized: true,
      error: err?.message || "Failed to load cart",
    });
    return null;
  }
}

/**
 * Add product variant to active cart.
 */
export async function addToCart(
  productVariantId: string,
  quantity: number,
  options?: {
    productName?: string;
    variantDetails?: string;
  }
): Promise<boolean> {
  $cart.set({
    ...$cart.get(),
    loading: true,
  });

  try {
    const result = await addItemToOrder(productVariantId, quantity);

    if (result.order) {
      $cart.set({
        order: result.order,
        loading: false,
        initialized: true,
        error: null,
      });

      const details = options?.productName
        ? `${options.productName}${options.variantDetails ? ` (${options.variantDetails})` : ""} × ${quantity}`
        : `${quantity} ${quantity === 1 ? "item" : "items"} added to your cart`;

      toast.add({
        title: "Added to Cart!",
        description: details,
        type: "success",
      });
      return true;
    } else {
      const errMsg = result.error || "Could not add item to cart.";
      $cart.set({
        ...$cart.get(),
        loading: false,
        error: errMsg,
      });
      toast.add({
        title: "Cart Error",
        description: errMsg,
        type: "error",
      });
      return false;
    }
  } catch (err: any) {
    console.error("Failed to add item to order:", err);
    const errMsg = err?.message || "An unexpected error occurred while adding to cart.";
    $cart.set({
      ...$cart.get(),
      loading: false,
      error: errMsg,
    });
    toast.add({
      title: "Error",
      description: errMsg,
      type: "error",
    });
    return false;
  }
}

/**
 * Adjust order line quantity. If quantity <= 0, automatically removes the line.
 */
export async function updateLineQuantity(
  orderLineId: string,
  quantity: number
): Promise<boolean> {
  if (quantity <= 0) {
    return removeLineItem(orderLineId);
  }

  $cart.set({
    ...$cart.get(),
    loading: true,
  });

  try {
    const result = await adjustOrderLine(orderLineId, quantity);

    if (result.order) {
      $cart.set({
        order: result.order,
        loading: false,
        initialized: true,
        error: null,
      });
      return true;
    } else {
      const errMsg = result.error || "Failed to update item quantity.";
      $cart.set({
        ...$cart.get(),
        loading: false,
        error: errMsg,
      });
      toast.add({
        title: "Update Failed",
        description: errMsg,
        type: "error",
      });
      return false;
    }
  } catch (err: any) {
    console.error("Failed to adjust order line:", err);
    $cart.set({
      ...$cart.get(),
      loading: false,
      error: err?.message || "Error updating item quantity",
    });
    toast.add({
      title: "Error",
      description: err?.message || "Failed to update item quantity.",
      type: "error",
    });
    return false;
  }
}

/**
 * Remove an order line completely from the active order.
 */
export async function removeLineItem(orderLineId: string): Promise<boolean> {
  $cart.set({
    ...$cart.get(),
    loading: true,
  });

  try {
    const result = await removeOrderLine(orderLineId);

    if (result.order) {
      $cart.set({
        order: result.order,
        loading: false,
        initialized: true,
        error: null,
      });
      toast.add({
        title: "Item Removed",
        description: "Item was removed from your cart.",
        type: "info",
      });
      return true;
    } else {
      const errMsg = result.error || "Failed to remove item from cart.";
      $cart.set({
        ...$cart.get(),
        loading: false,
        error: errMsg,
      });
      toast.add({
        title: "Remove Failed",
        description: errMsg,
        type: "error",
      });
      return false;
    }
  } catch (err: any) {
    console.error("Failed to remove order line:", err);
    $cart.set({
      ...$cart.get(),
      loading: false,
      error: err?.message || "Error removing item",
    });
    toast.add({
      title: "Error",
      description: err?.message || "Failed to remove item.",
      type: "error",
    });
    return false;
  }
}

/**
 * Apply coupon / promotional discount code.
 */
export async function applyCoupon(couponCode: string): Promise<boolean> {
  const trimmed = couponCode.trim();
  if (!trimmed) return false;

  $cart.set({
    ...$cart.get(),
    loading: true,
  });

  try {
    const result = await applyCouponCode(trimmed);

    if (result.order) {
      $cart.set({
        order: result.order,
        loading: false,
        initialized: true,
        error: null,
      });
      toast.add({
        title: "Coupon Applied!",
        description: `Coupon "${trimmed}" has been successfully applied to your order.`,
        type: "success",
      });
      return true;
    } else {
      const errMsg = result.error || "Coupon code is invalid or not applicable.";
      $cart.set({
        ...$cart.get(),
        loading: false,
        error: errMsg,
      });
      toast.add({
        title: "Coupon Invalid",
        description: errMsg,
        type: "error",
      });
      return false;
    }
  } catch (err: any) {
    console.error("Failed to apply coupon code:", err);
    $cart.set({
      ...$cart.get(),
      loading: false,
      error: err?.message || "Error applying coupon code",
    });
    toast.add({
      title: "Error",
      description: err?.message || "Failed to apply coupon code.",
      type: "error",
    });
    return false;
  }
}

/**
 * Remove an applied coupon code.
 */
export async function removeCoupon(couponCode: string): Promise<boolean> {
  $cart.set({
    ...$cart.get(),
    loading: true,
  });

  try {
    const result = await removeCouponCode(couponCode);

    if (result.order) {
      $cart.set({
        order: result.order,
        loading: false,
        initialized: true,
        error: null,
      });
      toast.add({
        title: "Coupon Removed",
        description: `Coupon "${couponCode}" has been removed.`,
        type: "info",
      });
      return true;
    } else {
      $cart.set({
        ...$cart.get(),
        loading: false,
      });
      return false;
    }
  } catch (err: any) {
    console.error("Failed to remove coupon code:", err);
    $cart.set({
      ...$cart.get(),
      loading: false,
      error: err?.message || "Error removing coupon code",
    });
    return false;
  }
}

/**
 * Resets the active cart state (e.g. after successful order completion).
 */
export function clearCartState(): void {
  $cart.set({
    order: null,
    loading: false,
    initialized: true,
    error: null,
  });
}
