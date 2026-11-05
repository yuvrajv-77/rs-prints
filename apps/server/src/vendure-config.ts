import {
    dummyPaymentHandler,
    DefaultJobQueuePlugin,
    DefaultSchedulerPlugin,
    DefaultSearchPlugin,
    VendureConfig,

} from '@vendure/core';
import { defaultEmailHandlers, EmailPlugin, FileBasedTemplateLoader } from '@vendure/email-plugin';
// import { AssetServerPlugin } from '@vendure/asset-server-plugin';
import { DashboardPlugin } from '@vendure/dashboard/plugin';
import { GraphiqlPlugin } from '@vendure/graphiql-plugin';
import 'dotenv/config';
import path from 'path';
import { AssetServerPlugin, configureS3AssetStorage } from '@vendure/asset-server-plugin';

import { RazorpayPlugin } from './plugins/razorpay/razorpay.plugin';
import { codPaymentHandler } from './plugins/cod/cod.handler';


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
        extra: {
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 30000,
            keepAlive: true,
        },
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
        paymentMethodHandlers: [dummyPaymentHandler, codPaymentHandler],
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

        RazorpayPlugin,
    ],
};
