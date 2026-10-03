import { vendureDashboardPlugin } from '@vendure/dashboard/vite';
import { join, resolve } from 'path';
import { pathToFileURL } from 'url';
import { defineConfig } from 'vite';

export default defineConfig({
    base: '/dashboard',
    build: {
        outDir: join(__dirname, 'dist/dashboard'),
    },
    plugins: [
        vendureDashboardPlugin({
            // The vendureDashboardPlugin will scan your configuration in order
            // to find any plugins which have dashboard extensions, as well as
            // to introspect the GraphQL schema based on any API extensions
            // and custom fields that are configured.
            vendureConfigPath: pathToFileURL('./src/vendure-config.ts'),
            // Points to the location of your Vendure server.
            // In production, 'auto' lets the dashboard derive the API URL from the
            // server that serves it. In development, we use explicit defaults so that
            // the Vite dev server can reach the Vendure backend.
            api: process.env.NODE_ENV === 'production'
                ? { host: 'auto', port: 'auto' }
                : { host: 'http://localhost', port: 3000 },
            // When you start the Vite server, your Admin API schema will
            // be introspected and the types will be generated in this location.
            // These types can be used in your dashboard extensions to provide
            // type safety when writing queries and mutations.
            gqlOutputPath: './src/gql',
            // Dashboard UI theming & branding in Vendure v3
            theme: {
                light: {
                    primary: '#ffd747',
                    'primary-foreground': '#000000',
                    'sidebar-primary': '#ffd747',
                    'sidebar-primary-foreground': '#000000',
                    ring: '#ffd747',
                    brand: '#ffd747',
                    'brand-lighter': '#ffeaa0',
                    'brand-darker': '#e5b800',
                },
                dark: {
                    primary: '#aff33e',
                    'primary-foreground': '#000000',
                    'sidebar-primary': '#aff33e',
                    'sidebar-primary-foreground': '#000000',
                    ring: '#aff33e',
                    brand: '#aff33e',
                    'brand-lighter': '#cbf97a',
                    'brand-darker': '#88cc1e',
                },
                additionalStylesheets: [resolve(__dirname, 'src/dashboard.css')],
            },
        }),
        {
            name: 'dashboard-branding',
            transformIndexHtml(html) {
                return html.replace(/<title>.*?<\/title>/i, '<title>RS Prints Dashboard</title>');
            },
        },
    ],
    resolve: {
        alias: {
            // This allows all plugins to reference a shared set of
            // GraphQL types.
            '@/gql': resolve(__dirname, './src/gql/graphql.ts'),
        },
    },
});
