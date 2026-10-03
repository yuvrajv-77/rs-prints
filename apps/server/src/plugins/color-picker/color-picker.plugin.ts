import { PluginCommonModule, VendurePlugin } from '@vendure/core';

/**
 * ColorPickerPlugin
 * Integrates an interactive color picker with text color code input
 * into the Vendure Admin dashboard for custom fields.
 */
@VendurePlugin({
    imports: [PluginCommonModule],
    dashboard: './dashboard/index.tsx',
})
export class ColorPickerPlugin {}
