import React from 'react';
import type { DashboardFormComponentProps } from '@vendure/dashboard';
import { Input } from '@vendure/dashboard';

/**
 * ColorPickerInput
 * Renders an interactive color picker with a companion hex color code input.
 * - Clicking the color swatch opens the native color picker dialog.
 * - Typing or pasting in the text box updates the hex value and swatch preview.
 */
export const ColorPickerInput: React.FC<DashboardFormComponentProps> = ({
    value,
    onChange,
    disabled,
}) => {
    const rawVal = typeof value === 'string' ? value : '';
    // Native <input type="color"> requires a valid 7-character hex code (#rrggbb)
    const validHex = /^#[0-9A-Fa-f]{6}$/.test(rawVal) ? rawVal : '#000000';

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
                <input
                    type="color"
                    value={validHex}
                    disabled={disabled}
                    onChange={handleColorChange}
                    style={{
                        width: '36px',
                        height: '36px',
                        padding: '2px',
                        borderRadius: '6px',
                        border: '1px solid var(--border, #ccc)',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        backgroundColor: 'transparent',
                    }}
                    title="Choose color from palette"
                />
            </div>
            <Input
                type="text"
                value={rawVal}
                placeholder="#000000"
                disabled={disabled}
                onChange={handleTextChange}
                style={{ maxWidth: '160px', fontFamily: 'monospace', textTransform: 'uppercase' }}
            />
            {rawVal ? (
                <button
                    type="button"
                    onClick={() => onChange('')}
                    disabled={disabled}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: 'var(--muted-foreground, #888)',
                        textDecoration: 'underline',
                    }}
                >
                    Clear
                </button>
            ) : null}
        </div>
    );
};
