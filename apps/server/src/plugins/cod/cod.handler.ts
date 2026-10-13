import { PaymentMethodHandler, LanguageCode } from '@vendure/core';

export const codPaymentHandler = new PaymentMethodHandler({
  code: 'cash-on-delivery',
  description: [
    { languageCode: LanguageCode.en, value: 'Cash on Delivery (Pay on Receipt)' },
  ],
  args: {},
  createPayment: async (ctx, order, amount, args, metadata) => {
    return {
      amount: order.totalWithTax,
      state: 'Settled' as const,
      transactionId: `COD_${Date.now()}_${order.code}`,
      metadata: {
        paymentType: 'Cash on Delivery',
        ...metadata,
      },
    };
  },
  settlePayment: async () => {
    return { success: true };
  },
});
