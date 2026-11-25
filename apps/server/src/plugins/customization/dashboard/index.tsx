import {
    Badge,
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    defineDashboardExtension,
} from '@vendure/dashboard';
import React from 'react';

interface SerializedArtwork {
    id: string;
    name: string;
    dataUrl?: string;
    assetId?: string;
    assetUrl?: string;
    left: number;
    top: number;
    scaleX: number;
    scaleY: number;
    angle: number;
    flipX: boolean;
    flipY: boolean;
    opacity: number;
}

interface ViewCustomizationData {
    positionId: string;
    positionName: string;
    physicalSizeLabel?: string;
    previewDataUrl?: string;
    previewAssetId?: string;
    previewAssetUrl?: string;
    artworks: SerializedArtwork[];
}

interface CustomizationDataPayload {
    id: string;
    productId?: string;
    productSlug?: string;
    productName?: string;
    productType?: string;
    variantId?: string;
    sku?: string;
    colorId?: string;
    colorName?: string;
    size?: string;
    quantity?: number;
    customAttributes?: Record<string, string>;
    notes?: string;
    front?: ViewCustomizationData;
    back?: ViewCustomizationData;
    timestamp?: number;
}

function resolveDashboardAssetUrl(rawUrl?: string): string {
    if (!rawUrl) return '';
    const clean = rawUrl.trim().replace(/\\/g, '/');
    if (!clean) return '';
    if (clean.startsWith('data:') || clean.startsWith('http://') || clean.startsWith('https://')) {
        return clean;
    }
    const base =
        typeof window !== 'undefined'
            ? window.location.port === '5173'
                ? 'http://localhost:3000'
                : window.location.origin
            : '';
    if (clean.startsWith('/')) return `${base}${clean}`;
    return `${base}/assets/${clean.replace(/^assets\//, '')}`;
}

async function triggerFileDownload(url: string, filename: string) {
    if (!url) return;
    if (url.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
    }

    try {
        const response = await fetch(url, { credentials: 'include' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
    } catch {
        window.open(url, '_blank', 'noopener,noreferrer');
    }
}

function DownloadIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-3.5 h-3.5 mr-1.5 shrink-0"
        >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" x2="12" y1="15" y2="3" />
        </svg>
    );
}

function ExternalLinkIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-3.5 h-3.5 mr-1 shrink-0"
        >
            <path d="M15 3h6v6" />
            <path d="M10 14 21 3" />
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        </svg>
    );
}

function parseLineCustomization(line: any): CustomizationDataPayload | null {
    const raw = line?.customFields?.customizationData;
    if (!raw || typeof raw !== 'string') return null;
    try {
        return JSON.parse(raw) as CustomizationDataPayload;
    } catch {
        return null;
    }
}

function formatAttributeLabel(key: string): string {
    return key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

function ViewSection({
    label,
    view,
    orderCode,
    lineIndex,
}: {
    label: 'Front' | 'Back';
    view: ViewCustomizationData;
    orderCode: string;
    lineIndex: number;
}) {
    const previewUrl = resolveDashboardAssetUrl(view.previewAssetUrl || view.previewDataUrl);
    const artworks = view.artworks || [];
    const sideSlug = label.toLowerCase();
    const filePrefix = `${orderCode || 'order'}-item${lineIndex + 1}-${sideSlug}`;

    return (
        <div className="rounded-lg border p-4 space-y-3 bg-muted/15">
            <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-semibold">
                    {label} Print
                </Badge>
                <span className="text-sm font-medium text-foreground">
                    {view.positionName || view.positionId}
                </span>
                {view.physicalSizeLabel && (
                    <span className="text-xs text-muted-foreground">
                        • Print Area: {view.physicalSizeLabel}
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Mockup Preview */}
                <div className="rounded-md border bg-background p-3 space-y-2.5 flex flex-col justify-between">
                    <div className="text-xs font-semibold text-muted-foreground">
                        Mockup Preview
                    </div>
                    {previewUrl ? (
                        <>
                            <a
                                href={previewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block overflow-hidden rounded border bg-white"
                                title="Open full mockup preview"
                            >
                                <img
                                    src={previewUrl}
                                    alt={`${label} mockup preview`}
                                    className="w-full h-48 object-contain"
                                />
                            </a>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-xs"
                                    onClick={() => triggerFileDownload(previewUrl, `${filePrefix}-mockup.png`)}
                                >
                                    <DownloadIcon />
                                    Download Mockup
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs"
                                    render={<a href={previewUrl} target="_blank" rel="noopener noreferrer" />}
                                >
                                    <ExternalLinkIcon />
                                    View
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="h-48 flex items-center justify-center rounded border border-dashed text-xs text-muted-foreground">
                            No mockup preview available
                        </div>
                    )}
                </div>

                {/* Right: Uploaded Custom Artwork(s) */}
                <div className="rounded-md border bg-background p-3 space-y-2.5 flex flex-col justify-between">
                    <div className="text-xs font-semibold text-muted-foreground">
                        Uploaded Custom Artwork{artworks.length > 1 ? `s (${artworks.length})` : ''}
                    </div>
                    {artworks.length > 0 ? (
                        <div className="space-y-3 flex-1 flex flex-col justify-between">
                            {artworks.map((art, artIdx) => {
                                const artUrl = resolveDashboardAssetUrl(art.assetUrl || art.dataUrl);
                                const safeName = art.name || `artwork-${artIdx + 1}.png`;
                                const angle = Math.round(art.angle || 0);
                                const adjustments = [
                                    angle !== 0 ? `Rotated ${angle}°` : null,
                                    art.flipX ? 'Flipped Horizontally' : null,
                                    art.flipY ? 'Flipped Vertically' : null,
                                ].filter(Boolean);

                                return (
                                    <div key={art.id || artIdx} className="space-y-2.5">
                                        {artUrl && (
                                            <a
                                                href={artUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block overflow-hidden rounded border bg-white"
                                                title={`Open ${safeName}`}
                                            >
                                                <img
                                                    src={artUrl}
                                                    alt={safeName}
                                                    className="w-full h-48 object-contain"
                                                />
                                            </a>
                                        )}

                                        <div className="space-y-1">
                                            <div className="text-xs font-medium truncate" title={safeName}>
                                                File: {safeName}
                                            </div>
                                            {adjustments.length > 0 && (
                                                <div className="text-[11px] text-muted-foreground">
                                                    {adjustments.join(' • ')}
                                                </div>
                                            )}
                                        </div>

                                        {artUrl && (
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    className="flex-1 text-xs"
                                                    onClick={() =>
                                                        triggerFileDownload(artUrl, `${filePrefix}-${safeName}`)
                                                    }
                                                >
                                                    <DownloadIcon />
                                                    Download Artwork
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-xs"
                                                    render={<a href={artUrl} target="_blank" rel="noopener noreferrer" />}
                                                >
                                                    <ExternalLinkIcon />
                                                    View
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-48 flex items-center justify-center rounded border border-dashed text-xs text-muted-foreground">
                            No artwork uploaded for this side
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function OrderCustomizationsBlock({ context }: { context: { entity?: any } }) {
    const order = context.entity;
    const lines: any[] = order?.lines || [];

    const customizedLines = lines
        .map((line, idx) => ({
            line,
            idx,
            customization: parseLineCustomization(line),
        }))
        .filter((item) => item.customization !== null || item.line?.customFields?.customizationId);

    if (customizedLines.length === 0) {
        return null;
    }

    const customerName = order?.customer
        ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim()
        : '';
    const customerEmail = order?.customer?.emailAddress || '';
    const customerPhone =
        order?.customer?.phoneNumber || order?.shippingAddress?.phoneNumber || '';

    return (
        <div className="space-y-4">
            {/* Quick Customer Summary Banner */}
            {(customerName || customerEmail || customerPhone) && (
                <div className="rounded-lg border bg-muted/20 px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-1.5 text-xs">
                    {customerName && (
                        <div>
                            <span className="text-muted-foreground">Customer: </span>
                            <span className="font-semibold text-foreground">{customerName}</span>
                        </div>
                    )}
                    {customerEmail && (
                        <div>
                            <span className="text-muted-foreground">Email: </span>
                            <span className="font-medium text-foreground">{customerEmail}</span>
                        </div>
                    )}
                    {customerPhone && (
                        <div>
                            <span className="text-muted-foreground">Phone: </span>
                            <span className="font-medium text-foreground">{customerPhone}</span>
                        </div>
                    )}
                </div>
            )}

            {customizedLines.map(({ line, idx, customization }) => {
                const variant = line.productVariant;
                const customAttrs = customization?.customAttributes
                    ? Object.entries(customization.customAttributes)
                    : [];

                const detailItems: Array<{ label: string; value: string }> = [
                    { label: 'Quantity', value: `${line.quantity} pc${line.quantity === 1 ? '' : 's'}` },
                    { label: 'SKU', value: customization?.sku || variant?.sku || '—' },
                ];

                if (customization?.colorName) {
                    detailItems.push({ label: 'Colour / Finish', value: customization.colorName });
                }
                if (customization?.size) {
                    detailItems.push({ label: 'Size', value: customization.size });
                }
                for (const [k, v] of customAttrs) {
                    if (v) {
                        detailItems.push({ label: formatAttributeLabel(k), value: v });
                    }
                }
                if (customization?.front) {
                    detailItems.push({
                        label: 'Front Placement',
                        value: customization.front.positionName || customization.front.positionId,
                    });
                }
                if (customization?.back) {
                    detailItems.push({
                        label: 'Back Placement',
                        value: customization.back.positionName || customization.back.positionId,
                    });
                }

                return (
                    <Card key={line.id || idx} className="overflow-hidden">
                        <CardHeader className="pb-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <CardTitle className="text-base font-bold">
                                    {idx + 1}. {customization?.productName || variant?.name || 'Customized Item'}
                                </CardTitle>
                                <Badge variant="secondary" className="text-xs font-semibold">
                                    Qty: {line.quantity}
                                </Badge>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {/* Clear, Human-Readable Specification Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 rounded-lg border bg-muted/15 p-3">
                                {detailItems.map((item) => (
                                    <div key={item.label} className="space-y-0.5 min-w-0">
                                        <div className="text-[11px] text-muted-foreground">
                                            {item.label}
                                        </div>
                                        <div className="text-xs font-semibold text-foreground truncate" title={item.value}>
                                            {item.value}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Customer Notes / Printing Instructions */}
                            {customization?.notes && (
                                <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
                                    <div className="font-semibold text-foreground mb-0.5">
                                        Customer Printing Instructions:
                                    </div>
                                    <div className="whitespace-pre-wrap text-foreground/90">
                                        {customization.notes}
                                    </div>
                                </div>
                            )}

                            {/* Front & Back Visuals */}
                            {customization?.front && (
                                <ViewSection
                                    label="Front"
                                    view={customization.front}
                                    orderCode={order?.code || 'order'}
                                    lineIndex={idx}
                                />
                            )}

                            {customization?.back && (
                                <ViewSection
                                    label="Back"
                                    view={customization.back}
                                    orderCode={order?.code || 'order'}
                                    lineIndex={idx}
                                />
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

export default defineDashboardExtension({
    pageBlocks: [
        {
            id: 'order-customizations',
            title: 'Custom Print Details & Uploaded Artworks',
            location: {
                pageId: 'order-detail',
                column: 'main',
                position: {
                    blockId: 'order-table',
                    order: 'after',
                },
            },
            shouldRender: (context) => {
                const lines: any[] = context.entity?.lines || [];
                return lines.some(
                    (line) =>
                        Boolean(line?.customFields?.customizationData) ||
                        Boolean(line?.customFields?.customizationId),
                );
            },
            component: OrderCustomizationsBlock,
        },
    ],
});
