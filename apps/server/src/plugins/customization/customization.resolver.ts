import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { Ctx, RequestContext } from '@vendure/core';
import { CustomizationService, CustomizationAssetResult } from './customization.service';

@Resolver()
export class CustomizationShopResolver {
  constructor(private customizationService: CustomizationService) {}

  @Mutation()
  async uploadCustomizationArtwork(
    @Ctx() ctx: RequestContext,
    @Args('file') file: Promise<any>,
    @Args('tags') tags?: string[] | null,
  ): Promise<CustomizationAssetResult> {
    return this.customizationService.uploadArtwork(ctx, file, tags);
  }
}
