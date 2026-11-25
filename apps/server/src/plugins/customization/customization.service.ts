import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  AssetService,
  EntityHydrator,
  EventBus,
  OrderStateTransitionEvent,
  RequestContext,
  UserInputError,
  isGraphQlErrorResult,
} from '@vendure/core';

export interface CustomizationAssetResult {
  id: string;
  name: string;
  source: string;
  preview: string;
  mimeType: string;
}

@Injectable()
export class CustomizationService implements OnModuleInit {
  constructor(
    private assetService: AssetService,
    private eventBus: EventBus,
    private entityHydrator: EntityHydrator,
  ) {}

  onModuleInit() {
    this.eventBus.ofType(OrderStateTransitionEvent).subscribe((event) => {
      if (event.toState === 'PaymentSettled' || event.toState === 'ArrangingPayment') {
        void this.tagOrderCustomizationAssets(event).catch((err) => {
          console.warn('Failed to tag customization assets for order:', err);
        });
      }
    });
  }

  /**
   * Automatically tags uploaded customization assets with the order code and customer
   * email when checkout/payment runs, making them searchable in Catalog -> Assets.
   */
  private async tagOrderCustomizationAssets(event: OrderStateTransitionEvent): Promise<void> {
    await this.entityHydrator.hydrate(event.ctx, event.order, {
      relations: ['lines', 'customer'],
    });

    const assetIds = new Set<string>();
    for (const line of event.order.lines || []) {
      const raw = (line.customFields as Record<string, any> | undefined)?.customizationData;
      if (!raw || typeof raw !== 'string') continue;
      try {
        const parsed = JSON.parse(raw);
        for (const side of ['front', 'back'] as const) {
          const view = parsed?.[side];
          if (!view) continue;
          if (view.previewAssetId) assetIds.add(String(view.previewAssetId));
          if (view.productionAssetId) assetIds.add(String(view.productionAssetId));
          if (Array.isArray(view.artworks)) {
            for (const art of view.artworks) {
              if (art?.assetId) assetIds.add(String(art.assetId));
            }
          }
        }
      } catch {
        // Ignore malformed JSON on unrelated lines
      }
    }

    if (assetIds.size === 0) return;

    const orderTag = `order-${event.order.code}`;
    const customerEmail = event.order.customer?.emailAddress?.trim().toLowerCase();
    const customerTag = customerEmail ? `customer-${customerEmail}` : undefined;

    for (const assetId of assetIds) {
      const asset = await this.assetService.findOne(event.ctx, assetId, ['tags']);
      if (!asset) continue;
      const existingTags = (asset.tags || []).map((t) => t.value);
      const mergedTags = Array.from(
        new Set([...existingTags, orderTag, ...(customerTag ? [customerTag] : [])]),
      );
      await this.assetService.update(event.ctx, {
        id: assetId,
        tags: mergedTags,
      });
    }
  }

  /**
   * Persist an uploaded customer artwork, mockup preview, or production PNG
   * as a Vendure Asset (stored in S3 or local AssetServerPlugin storage).
   */
  async uploadArtwork(
    ctx: RequestContext,
    file: Promise<any>,
    tags?: string[] | null,
  ): Promise<CustomizationAssetResult> {
    if (!file) {
      throw new UserInputError('No artwork file provided.');
    }

    const asset = await this.assetService.create(ctx, {
      file,
      tags: tags && tags.length > 0 ? tags : ['custom-artwork'],
    });

    if (isGraphQlErrorResult(asset)) {
      throw new UserInputError(asset.message || 'Unsupported artwork file format.');
    }

    const formatAssetPath = (raw: string) => {
      if (!raw) return '';
      const clean = raw.replace(/\\/g, '/').replace(/^\/+/, '');
      if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
      return `/assets/${clean.replace(/^assets\//, '')}`;
    };

    return {
      id: String(asset.id),
      name: asset.name,
      source: formatAssetPath(asset.source),
      preview: formatAssetPath(asset.preview),
      mimeType: asset.mimeType,
    };
  }
}
