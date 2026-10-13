import { PluginCommonModule, VendurePlugin } from '@vendure/core';
import gql from 'graphql-tag';
import { razorpayPaymentHandler } from './razorpay.handler';
import { RazorpayService } from './razorpay.service';
import { RazorpayShopResolver } from './razorpay.resolver';

const shopApiExtensions = gql`
  type RazorpayOrderData {
    id: String!
    amount: Int!
    currency: String!
    keyId: String!
  }

  extend type Mutation {
    createRazorpayOrder: RazorpayOrderData!
  }
`;

@VendurePlugin({
  imports: [PluginCommonModule],
  providers: [RazorpayService],
  shopApiExtensions: {
    schema: shopApiExtensions,
    resolvers: [RazorpayShopResolver],
  },
  configuration: (config) => {
    config.paymentOptions.paymentMethodHandlers.push(razorpayPaymentHandler);
    return config;
  },
})
export class RazorpayPlugin {}
