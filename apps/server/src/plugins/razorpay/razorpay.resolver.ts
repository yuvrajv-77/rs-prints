import { Resolver, Mutation } from '@nestjs/graphql';
import { Ctx, RequestContext, OrderService, UserInputError } from '@vendure/core';
import { RazorpayService, RazorpayOrderData } from './razorpay.service';

@Resolver()
export class RazorpayShopResolver {
  constructor(
    private razorpayService: RazorpayService,
    private orderService: OrderService,
  ) {}

  @Mutation()
  async createRazorpayOrder(@Ctx() ctx: RequestContext): Promise<RazorpayOrderData> {
    const orderId = ctx.session?.activeOrderId;
    if (!orderId) {
      throw new UserInputError('No active order found for the current session');
    }
    const order = await this.orderService.findOne(ctx, orderId);
    if (!order) {
      throw new UserInputError('Active order could not be loaded');
    }
    return this.razorpayService.createRazorpayOrder(ctx, order);
  }
}
