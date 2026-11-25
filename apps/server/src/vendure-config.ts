import {
    dummyPaymentHandler,
    DefaultJobQueuePlugin,
    DefaultSchedulerPlugin,
    DefaultSearchPlugin,
    VendureConfig,
    AccountRegistrationEvent,
    CustomerService,
    OrderStateTransitionEvent,
    EntityHydrator,
    Injector,
    RequestContext,
} from '@vendure/core';
import {
    EmailPlugin,
    FileBasedTemplateLoader,
    EmailEventListener,
    emailVerificationHandler,
    passwordResetHandler,
    emailAddressChangeHandler,
    transformOrderLineAssetUrls,
    shippingLinesWithMethod,
} from '@vendure/email-plugin';
// import { AssetServerPlugin } from '@vendure/asset-server-plugin';
import { DashboardPlugin } from '@vendure/dashboard/plugin';
import { GraphiqlPlugin } from '@vendure/graphiql-plugin';
import dotenv from 'dotenv';
import path from 'path';

// Explicitly load .env from apps/server/.env regardless of where the command is executed
dotenv.config({ path: process.env.ENV_FILE || path.join(__dirname, '../.env.test') });
dotenv.config();

import {
    AssetServerOptions,
    AssetServerPlugin,
    configureS3AssetStorage,
    HashedAssetNamingStrategy,
    S3Config,
} from '@vendure/asset-server-plugin';

const toPosixKey = (key: string) => key.replace(/\\/g, '/').replace(/^\/+/, '');

/**
 * Ensures asset paths stored in Postgres always use POSIX `/` separators even when uploaded on Windows.
 */
class PosixHashedAssetNamingStrategy extends HashedAssetNamingStrategy {
    generateSourceFileName(ctx: RequestContext, originalFileName: string, conflictFileName?: string): string {
        return toPosixKey(super.generateSourceFileName(ctx, originalFileName, conflictFileName));
    }
    generatePreviewFileName(ctx: RequestContext, originalFileName: string, conflictFileName?: string): string {
        return toPosixKey(super.generatePreviewFileName(ctx, originalFileName, conflictFileName));
    }
}

/**
 * Wraps Vendure's S3 strategy so object keys never use Windows `\` (from `path.join`) while
 * keeping the instance an `S3AssetStorageStrategy` for AssetServerPlugin's `instanceof` check.
 */
function configurePosixS3AssetStorage(s3Config: S3Config) {
    const baseFactory = configureS3AssetStorage(s3Config);
    return (options: AssetServerOptions) => {
        const strategy = baseFactory(options);
        const origWriteBuffer = strategy.writeFileFromBuffer.bind(strategy);
        const origWriteStream = strategy.writeFileFromStream.bind(strategy);
        const origReadBuffer = strategy.readFileToBuffer.bind(strategy);
        const origReadStream = strategy.readFileToStream.bind(strategy);
        const origDelete = strategy.deleteFile.bind(strategy);
        const origExists = strategy.fileExists.bind(strategy);
        const origToAbsoluteUrl = strategy.toAbsoluteUrl;

        strategy.writeFileFromBuffer = (fileName, data) => origWriteBuffer(toPosixKey(fileName), data);
        strategy.writeFileFromStream = (fileName, data) => origWriteStream(toPosixKey(fileName), data);
        strategy.readFileToBuffer = (id) => origReadBuffer(toPosixKey(id));
        strategy.readFileToStream = (id) => origReadStream(toPosixKey(id));
        strategy.deleteFile = (id) => origDelete(toPosixKey(id));
        strategy.fileExists = (fileName) => origExists(toPosixKey(fileName));
        (strategy as unknown as { toAbsoluteUrl: typeof origToAbsoluteUrl }).toAbsoluteUrl = (req, id) =>
            origToAbsoluteUrl(req, id.replace(/\\/g, '/'));
        (strategy as unknown as { getObjectParams: (id: string) => { Bucket: string; Key: string } }).getObjectParams =
            (id: string) => ({
                Bucket: s3Config.bucket,
                Key: toPosixKey(id),
            });

        return strategy;
    };
}

import { RazorpayPlugin } from './plugins/razorpay/razorpay.plugin';
import { CustomizationPlugin } from './plugins/customization/customization.plugin';
import { codPaymentHandler } from './plugins/cod/cod.handler';


const IS_DEV = process.env.APP_ENV === 'dev';
// PORT wins because hosting platforms inject it into the environment at runtime, and that
// must take precedence over any value baked into the .env file at scaffold time.
const serverPort = +process.env.PORT || +process.env.VENDURE_SERVER_PORT || 3000;

/**
 * Welcome Email Handler for new customer registrations.
 * Automatically sends a personalized, branded welcome email via Hostinger SMTP.
 */
export const welcomeEmailHandler = new EmailEventListener('welcome')
    .on(AccountRegistrationEvent)
    .loadData(async ({ event, injector }) => {
        const customerService = injector.get(CustomerService);
        const customer = await customerService.findOneByUserId(event.ctx, event.user.id);
        return { customer };
    })
    .setRecipient(event => event.user.identifier)
    .setFrom('{{ fromAddress }}')
    .setSubject('Welcome to RS Prints! 🎉 Your account is ready')
    .setTemplateVars(event => ({
        customer: event.data.customer,
    }));

/**
 * Helper to hydrate full order relations and absolute asset URLs for email templates.
 */
const loadOrderData = async ({ event, injector }: { event: OrderStateTransitionEvent; injector: Injector }) => {
    const entityHydrator = injector.get(EntityHydrator);
    await entityHydrator.hydrate(event.ctx, event.order, {
        relations: ['lines.featuredAsset', 'lines.productVariant', 'shippingLines.shippingMethod', 'fulfillments'],
    });
    transformOrderLineAssetUrls(event.ctx, event.order, injector);
    const shippingLines = shippingLinesWithMethod(event.order);
    return { shippingLines };
};

/**
 * Order Confirmation Email Handler
 * Sent from orders@thersprints.com when an order payment is settled.
 */
export const orderConfirmationHandler = new EmailEventListener('order-confirmation')
    .on(OrderStateTransitionEvent)
    .filter(event => event.toState === 'PaymentSettled' && event.fromState !== 'Modifying' && !!event.order.customer)
    .loadData(loadOrderData)
    .setRecipient(event => event.order.customer!.emailAddress)
    .setFrom('{{ orderFromAddress }}')
    .setSubject('Order Confirmation for #{{ order.code }} - RS Prints')
    .setTemplateVars(event => ({
        order: event.order,
        shippingLines: event.data.shippingLines,
    }));

/**
 * Order Shipped Email Handler
 * Sent from orders@thersprints.com when an order transitions to Shipped.
 */
export const orderShippedHandler = new EmailEventListener('order-shipped')
    .on(OrderStateTransitionEvent)
    .filter(event => event.toState === 'Shipped' && !!event.order.customer)
    .loadData(loadOrderData)
    .setRecipient(event => event.order.customer!.emailAddress)
    .setFrom('{{ orderFromAddress }}')
    .setSubject('Your RS Prints Order #{{ order.code }} Has Shipped! 🚚')
    .setTemplateVars(event => ({
        order: event.order,
        shippingLines: event.data.shippingLines,
        fulfillment: event.order.fulfillments?.[event.order.fulfillments.length - 1],
    }));

/**
 * Order Delivered Email Handler
 * Sent from orders@thersprints.com when an order transitions to Delivered.
 */
export const orderDeliveredHandler = new EmailEventListener('order-delivered')
    .on(OrderStateTransitionEvent)
    .filter(event => event.toState === 'Delivered' && !!event.order.customer)
    .loadData(loadOrderData)
    .setRecipient(event => event.order.customer!.emailAddress)
    .setFrom('{{ orderFromAddress }}')
    .setSubject('Your RS Prints Order #{{ order.code }} Has Been Delivered! 🎉')
    .setTemplateVars(event => ({
        order: event.order,
        shippingLines: event.data.shippingLines,
        fulfillment: event.order.fulfillments?.[event.order.fulfillments.length - 1],
    }));

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
            origin: IS_DEV
                ? true
                : (process.env.CORS_ORIGINS
                    ? process.env.CORS_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
                    : [
                        'https://rs-prints.y74125.workers.dev',
                        'https://rs-prints-api.duckdns.org',
                    ]),
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
            sameSite: IS_DEV ? 'lax' : 'none',
            secure: !IS_DEV,
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
            namingStrategy: new PosixHashedAssetNamingStrategy(),
            storageStrategyFactory: process.env.AWS_ACCESS_KEY_ID
                ? configurePosixS3AssetStorage({
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
        // Reduce Neon database polling/egress: default 200ms pollInterval & 10s scheduler
        // check keep Neon compute awake 24/7 and generate millions of scans/week.
        DefaultSchedulerPlugin.init({
            manualTriggerCheckInterval: 60_000,
        }),
        DefaultJobQueuePlugin.init({
            useDatabaseForBuffer: true,
            keepJobsCount: 50,
            pollInterval: (queueName) => {
                if (queueName === 'send-email') {
                    return 10_000;
                }
                if (queueName === 'update-search-index' || queueName === 'apply-collection-filters') {
                    return 15_000;
                }
                return 30_000;
            },
        }),
        DefaultSearchPlugin.init({ bufferUpdates: false, indexStockStatus: true }),
        EmailPlugin.init({
            route: 'mailbox',
            handlers: [
                orderConfirmationHandler,
                orderShippedHandler,
                orderDeliveredHandler,
                welcomeEmailHandler,
                emailVerificationHandler,
                passwordResetHandler,
                emailAddressChangeHandler,
            ],
            templateLoader: new FileBasedTemplateLoader(path.join(__dirname, '../static/email/templates')),
            globalTemplateVars: {
                fromAddress: `"${process.env.EMAIL_FROM_NAME || 'RS Prints'}" <${process.env.EMAIL_FROM_ADDRESS || 'support@thersprints.com'}>`,
                orderFromAddress: `"${process.env.ORDER_EMAIL_FROM_NAME || 'RS Prints Orders'}" <${process.env.ORDER_EMAIL_FROM_ADDRESS || 'orders@thersprints.com'}>`,
                storefrontUrl: process.env.STOREFRONT_URL || 'https://rs-prints.y74125.workers.dev',
                verifyEmailAddressUrl: `${process.env.STOREFRONT_URL || 'https://rs-prints.y74125.workers.dev'}/verify`,
                passwordResetUrl: `${process.env.STOREFRONT_URL || 'https://rs-prints.y74125.workers.dev'}/password-reset`,
                changeEmailAddressUrl: `${process.env.STOREFRONT_URL || 'https://rs-prints.y74125.workers.dev'}/verify-email-address-change`,
            },
            ...(process.env.SMTP_HOST
                ? {
                    transport: {
                        type: 'smtp' as const,
                        host: process.env.SMTP_HOST,
                        port: Number(process.env.SMTP_PORT) || 465,
                        secure: (process.env.SMTP_PORT || '465') === '465',
                        auth: {
                            user: process.env.SMTP_USER || 'support@thersprints.com',
                            pass: process.env.SMTP_PASS || '',
                        },
                    },
                }
                : {
                    devMode: true as const,
                    outputPath: path.join(__dirname, '../static/email/test-emails'),
                }),
        }),
        DashboardPlugin.init({
            route: 'dashboard',
            appDir: IS_DEV
                ? path.join(__dirname, '../dist/dashboard')
                : path.join(__dirname, 'dashboard'),
        }),

        RazorpayPlugin,
        CustomizationPlugin,
    ],
};
