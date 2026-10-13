import { PaymentMethodHandler, LanguageCode } from '@vendure/core';
import crypto from 'crypto';

export const razorpayPaymentHandler = new PaymentMethodHandler({
  code: 'razorpay',
  description: [
    { languageCode: LanguageCode.en, value: 'Razorpay Online Payment (UPI, Cards, Netbanking)' },
  ],
  args: {
    keyId: {
      type: 'string',
      label: [{ languageCode: LanguageCode.en, value: 'Razorpay Key ID' }],
      defaultValue: process.env.RAZORPAY_KEY_ID || '',
    },
    keySecret: {
      type: 'string',
      label: [{ languageCode: LanguageCode.en, value: 'Razorpay Key Secret' }],
      defaultValue: process.env.RAZORPAY_KEY_SECRET || '',
    },
  },
  createPayment: async (ctx, order, amount, args, metadata) => {
    const keySecret = args.keySecret || process.env.RAZORPAY_KEY_SECRET;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = metadata;

    if (!razorpay_payment_id) {
      return {
        amount: order.totalWithTax,
        state: 'Declined' as const,
        errorMessage: 'Missing Razorpay payment ID',
        metadata,
      };
    }

    // In development mode or with placeholder keys, allow dev simulated payment
    const isPlaceholder =
      !keySecret ||
      keySecret === 'placeholder_secret' ||
      keySecret.startsWith('placeholder');

    if (isPlaceholder) {
      return {
        amount: order.totalWithTax,
        state: 'Settled' as const,
        transactionId: razorpay_payment_id,
        metadata: {
          ...metadata,
          mode: 'development_simulation',
        },
      };
    }

    // Cryptographic HMAC-SHA256 signature verification
    if (razorpay_order_id && razorpay_signature) {
      const body = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(body)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return {
          amount: order.totalWithTax,
          state: 'Declined' as const,
          errorMessage: 'Invalid Razorpay payment signature',
          metadata,
        };
      }
    }

    return {
      amount: order.totalWithTax,
      state: 'Settled' as const,
      transactionId: razorpay_payment_id,
      metadata,
    };
  },
  settlePayment: async () => {
    return { success: true };
  },
});
