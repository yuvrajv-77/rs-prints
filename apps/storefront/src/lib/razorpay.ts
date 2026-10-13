export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
}

declare global {
  interface Window {
    Razorpay?: new (options: any) => {
      open: () => void;
      on: (event: string, handler: (response: any) => void) => void;
    };
  }
}

/**
 * Dynamically loads the official Razorpay Checkout SDK script
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn("Failed to load Razorpay Checkout script");
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/**
 * Launches the Razorpay checkout modal and returns payment details via Promise.
 * In development simulation mode (when using placeholder key rzp_test_placeholder),
 * falls back to a simulated approval so developers can test the end-to-end checkout flow.
 */
export async function openRazorpayCheckout(
  options: RazorpayCheckoutOptions
): Promise<RazorpayResponse> {
  const isPlaceholderKey =
    !options.key ||
    options.key === "rzp_test_placeholder" ||
    options.key.includes("placeholder");

  // In test / simulation mode with placeholder credentials:
  if (isPlaceholderKey) {
    return new Promise((resolve) => {
      // Simulate Razorpay payment modal with a small timeout or dev confirmation
      const simulatedPaymentId = `pay_sim_${Date.now()}`;
      setTimeout(() => {
        resolve({
          razorpay_payment_id: simulatedPaymentId,
          razorpay_order_id: options.order_id,
          razorpay_signature: `sig_sim_${Date.now()}`,
        });
      }, 800);
    });
  }

  // Real Razorpay flow
  const scriptLoaded = await loadRazorpayScript();
  if (!scriptLoaded || !window.Razorpay) {
    throw new Error("Unable to load Razorpay payment gateway. Please check your internet connection.");
  }

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay!({
      ...options,
      handler: (response: RazorpayResponse) => {
        resolve(response);
      },
      modal: {
        ondismiss: () => {
          reject(new Error("Payment was cancelled by the user."));
        },
      },
    });

    rzp.on("payment.failed", (response: any) => {
      reject(new Error(response?.error?.description || "Payment failed. Please try again."));
    });

    rzp.open();
  });
}
