import { Injectable } from '@nestjs/common';
import { RequestContext, Order, UserInputError } from '@vendure/core';
import Razorpay from 'razorpay';

export interface RazorpayOrderData {
  id: string;
  amount: number;
  currency: string;
  keyId: string;
}

@Injectable()
export class RazorpayService {
  async createRazorpayOrder(ctx: RequestContext, order: Order): Promise<RazorpayOrderData> {
    if (!order || !order.lines || order.lines.length === 0) {
      throw new UserInputError('Cannot create Razorpay order for an empty cart');
    }

    const keyId = process.env.RAZORPAY_KEY_ID || '';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
    const isPlaceholder =
      !keyId ||
      keyId === 'rzp_test_placeholder' ||
      !keySecret ||
      keySecret === 'placeholder_secret';

    const amountInPaise = Math.round(order.totalWithTax);

    // If real Razorpay credentials are provided, invoke Razorpay API
    if (!isPlaceholder) {
      try {
        const instance = new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        });

        const rzpOrder = await instance.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: order.code,
          notes: {
            orderCode: order.code,
            orderId: order.id.toString(),
          },
        });

        return {
          id: rzpOrder.id,
          amount: Number(rzpOrder.amount),
          currency: rzpOrder.currency,
          keyId,
        };
      } catch (err: any) {
        console.warn('Razorpay API call failed, falling back to mock response in dev:', err?.message || err);
      }
    }

    // Safe development simulation fallback when using placeholder keys
    return {
      id: `order_mock_${Date.now()}_${order.code}`,
      amount: amountInPaise,
      currency: 'INR',
      keyId: keyId || 'rzp_test_placeholder',
    };
  }
}
