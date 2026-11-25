import { PluginCommonModule, VendurePlugin } from '@vendure/core';
import gql from 'graphql-tag';
import { CustomizationService } from './customization.service';
import { CustomizationShopResolver } from './customization.resolver';

const shopApiExtensions = gql`
  type CustomizationAssetResult {
    id: ID!
    name: String!
    source: String!
    preview: String!
    mimeType: String!
  }

  extend type Mutation {
    uploadCustomizationArtwork(file: Upload!, tags: [String!]): CustomizationAssetResult!
  }
`;

@VendurePlugin({
  imports: [PluginCommonModule],
  providers: [CustomizationService],
  dashboard: './dashboard/index.tsx',
  shopApiExtensions: {
    schema: shopApiExtensions,
    resolvers: [CustomizationShopResolver],
  },
  configuration: (config) => {
    const existing = config.customFields.OrderLine || [];
    const existingNames = new Set(existing.map((f) => f.name));

    if (!existingNames.has('customizationId')) {
      existing.push({
        name: 'customizationId',
        type: 'string',
        nullable: true,
        public: true,
        label: [{ languageCode: 'en' as any, value: 'Customization ID' }],
      });
    }

    if (!existingNames.has('customizationData')) {
      existing.push({
        name: 'customizationData',
        type: 'text',
        nullable: true,
        public: true,
        label: [{ languageCode: 'en' as any, value: 'Customization JSON Data' }],
      });
    }

    config.customFields.OrderLine = existing;
    return config;
  },
})
export class CustomizationPlugin {}
