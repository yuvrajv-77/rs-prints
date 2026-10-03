import {
    dummyPaymentHandler,
    DefaultJobQueuePlugin,
    DefaultSchedulerPlugin,
    DefaultSearchPlugin,
    VendureConfig,
    LanguageCode,
} from '@vendure/core';
import { defaultEmailHandlers, EmailPlugin, FileBasedTemplateLoader } from '@vendure/email-plugin';
// import { AssetServerPlugin } from '@vendure/asset-server-plugin';
import { DashboardPlugin } from '@vendure/dashboard/plugin';
import { GraphiqlPlugin } from '@vendure/graphiql-plugin';
import 'dotenv/config';
import path from 'path';
import { AssetServerPlugin, configureS3AssetStorage } from '@vendure/asset-server-plugin';
import { ColorPickerPlugin } from './plugins/color-picker/color-picker.plugin';


const IS_DEV = process.env.APP_ENV === 'dev';
// PORT wins because hosting platforms inject it into the environment at runtime, and that
// must take precedence over any value baked into the .env file at scaffold time.
const serverPort = +process.env.PORT || +process.env.VENDURE_SERVER_PORT || 3000;

export const config: VendureConfig = {
    apiOptions: {
        port: serverPort,
        adminApiPath: 'admin-api',
        shopApiPath: 'shop-api',
        trustProxy: IS_DEV ? false : 1,
        // Which browser origins may make credentialed requests to the Shop and Admin APIs.
        // In dev any origin is reflected, so a storefront on any port works. In production set
        // CORS_ORIGINS to a comma-separated list of the origins you serve, for example
        // "https://example.com,https://admin.example.com". An unset value blocks all
        // cross-origin browser requests, which is the safe default.
        cors: {
            origin: IS_DEV ? true : (process.env.CORS_ORIGINS?.split(',').map(o => o.trim()).filter(Boolean) ?? []),
            credentials: true,
        },
        // The following options are useful in development mode,
        // but are best turned off for production for security
        // reasons.
        ...(IS_DEV ? {
            adminApiDebug: true,
            shopApiDebug: true,
        } : {}),
    },
    authOptions: {
        requireVerification: false,
        tokenMethod: ['bearer', 'cookie'],
        superadminCredentials: {
            identifier: process.env.SUPERADMIN_USERNAME,
            password: process.env.SUPERADMIN_PASSWORD,
        },
        cookieOptions: {
            secret: process.env.COOKIE_SECRET,
        },
    },
    dbConnectionOptions: {
        type: 'postgres',
        // See the README.md "Migrations" section for an explanation of
        // the `synchronize` and `migrations` options.
        synchronize: process.env.DB_SYNCHRONIZE === 'true',
        migrations: [path.join(__dirname, './migrations/*.+(js|ts)')],
        logging: false,
        schema: process.env.DB_SCHEMA || 'public',
        ...(process.env.DATABASE_URL
            ? {
                url: process.env.DATABASE_URL,
                ssl:
                    process.env.DATABASE_URL.includes('sslmode=require') ||
                        process.env.DB_SSL === 'true'
                        ? { rejectUnauthorized: false }
                        : undefined,
            }
            : {
                database: process.env.DB_NAME,
                host: process.env.DB_HOST,
                port: +(process.env.DB_PORT || 5432),
                username: process.env.DB_USERNAME,
                password: process.env.DB_PASSWORD,
                ...(process.env.DB_SSL === 'true'
                    ? { ssl: { rejectUnauthorized: false } }
                    : {}),
            }),
    },
    paymentOptions: {
        paymentMethodHandlers: [dummyPaymentHandler],
    },
    // Custom Fields Configuration:
    // Vendure allows extending built-in entities (Product, ProductOption, Order, Customer, etc.)
    // with custom fields. These must be defined under `customFields` on the root config object
    // (NEVER inside `plugins`, which is reserved exclusively for Vendure plugin classes/modules).
    //
    // Note: When adding or modifying custom fields, a database migration is required
    // (e.g. `npm run migration:generate -- add-color-code` then `npm run migration:run`)
    // so TypeORM creates the corresponding column in the database table (e.g. `product_option.customFieldsColorcode`).
    customFields: {
        ProductOption: [
            {
                // Property key exposed in GraphQL (`customFields.colorCode`)
                // and the column name in the database table.
                name: 'colorCode',

                // Stored as a hex color string (e.g. #FF5733)
                type: 'string',

                // Exposes this field via the Shop API for the storefront
                public: true,

                // Nullable for options that don't represent colors (e.g. Size 'S', 'M', 'L')
                nullable: true,

                // Custom UI component in the Vendure Admin dashboard:
                // Displays an interactive color picker alongside a direct hex code input!
                ui: {
                    component: 'color-picker-input',
                },

                // Display label shown in the Vendure Admin UI
                label: [{ languageCode: LanguageCode.en, value: 'Color' }],

                // Helper text rendered below the input in the Admin UI
                description: [{ languageCode: LanguageCode.en, value: 'Select color using the color picker or enter a hex code (#000000)' }],
            },
        ],
    },
    plugins: [
        GraphiqlPlugin.init(),
        // AssetServerPlugin.init({
        //     route: 'assets',
        //     assetUploadDir: path.join(__dirname, '../static/assets'),
        //     // For local dev, the correct value for assetUrlPrefix should
        //     // be guessed correctly, but for production it will usually need
        //     // to be set manually to match your production url.
        //     assetUrlPrefix: IS_DEV ? undefined : 'https://www.my-shop.com/assets/',
        // }),
        AssetServerPlugin.init({
            route: 'assets',
            assetUploadDir: path.join(__dirname, '../static/assets'),
            storageStrategyFactory: process.env.AWS_ACCESS_KEY_ID
                ? configureS3AssetStorage({
                    bucket: process.env.AWS_BUCKET_NAME || 'rs-assets',
                    credentials: {
                        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
                    },
                    nativeS3Configuration: {
                        endpoint: process.env.AWS_ENDPOINT_URL_S3,
                        forcePathStyle: true,
                        region: process.env.AWS_REGION || 'ap-southeast-1',
                    },
                })
                : undefined,
        }),
        DefaultSchedulerPlugin.init(),
        DefaultJobQueuePlugin.init({ useDatabaseForBuffer: true }),
        DefaultSearchPlugin.init({ bufferUpdates: false, indexStockStatus: true }),
        EmailPlugin.init({
            devMode: true,
            outputPath: path.join(__dirname, '../static/email/test-emails'),
            route: 'mailbox',
            handlers: defaultEmailHandlers,
            templateLoader: new FileBasedTemplateLoader(path.join(__dirname, '../static/email/templates')),
            globalTemplateVars: {
                // The following variables will change depending on your storefront implementation.
                // Here we are assuming a storefront running at http://localhost:8080.
                fromAddress: '"example" <noreply@example.com>',
                verifyEmailAddressUrl: 'http://localhost:8080/verify',
                passwordResetUrl: 'http://localhost:8080/password-reset',
                changeEmailAddressUrl: 'http://localhost:8080/verify-email-address-change'
            },
        }),
        DashboardPlugin.init({
            route: 'dashboard',
            appDir: IS_DEV
                ? path.join(__dirname, '../dist/dashboard')
                : path.join(__dirname, 'dashboard'),
        }),
        ColorPickerPlugin,
    ],
};
