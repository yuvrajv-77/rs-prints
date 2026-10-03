import { bootstrap, runMigrations } from '@vendure/core';
import { config } from './vendure-config';

// 1. Run Migrations:
// Before starting the server, check for and apply any pending database migrations.
// This is critical when defining or modifying `customFields` or updating Vendure core/plugins,
// ensuring the underlying SQL schema is completely up-to-date before any queries run.
runMigrations(config)
    // 2. Bootstrap Vendure:
    // Once migrations are successfully applied, bootstrap initializes the NestJS server instance,
    // connects to the database, spins up background workers/job queues, compiles the GraphQL schemas
    // (for both Shop and Admin APIs), and mounts configured plugins (Dashboard, AssetServer, Email, etc.).
    .then(() => bootstrap(config))
    // 3. Error Handling:
    // Catch any startup or database connection failures (e.g., unreachable database,
    // migration conflict, or invalid configuration) and log the failure.
    .catch(err => {
        console.error('Fatal error during Vendure startup:', err);
    });
