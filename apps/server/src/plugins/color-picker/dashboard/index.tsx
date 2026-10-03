import { defineDashboardExtension } from '@vendure/dashboard';
import { ColorPickerInput } from './color-picker-input';

/**
 * Dashboard extension registering the ColorPickerInput component
 * for custom field usage in the Vendure Admin UI.
 */
defineDashboardExtension({
    customFormComponents: {
        customFields: [
            {
                id: 'color-picker-input',
                component: ColorPickerInput,
            },
        ],
    },
});
