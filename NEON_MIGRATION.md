# Migration Guide: Local Docker PostgreSQL to Neon Serverless PostgreSQL

This document tracks the changes made to transition the Vendure server database from a local Docker Compose PostgreSQL container to a cloud-hosted Neon PostgreSQL database.

---

## 1. Overview of Changes

| Component | File | Description |
| :--- | :--- | :--- |
| **Environment Variables** | [`apps/server/.env`](file:///d:/RS%20Prints/apps/server/.env) | Replaced local `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` with `DATABASE_URL` and enabled `DB_SYNCHRONIZE=true`. |
| **Vendure Configuration** | [`apps/server/src/vendure-config.ts`](file:///d:/RS%20Prints/apps/server/src/vendure-config.ts) | Updated `dbConnectionOptions` to parse `DATABASE_URL`, enable SSL for cloud connections, and conditionally allow `synchronize`. |
| **Environment Types** | [`apps/server/src/environment.d.ts`](file:///d:/RS%20Prints/apps/server/src/environment.d.ts) | Added `DATABASE_URL`, `DB_SYNCHRONIZE`, and `DB_SSL` to TypeScript's `NodeJS.ProcessEnv` interface. |
| **Docker Compose** | [`apps/server/docker-compose.yml`](file:///d:/RS%20Prints/apps/server/docker-compose.yml) | Commented out the local `postgres_db` container to avoid redundant background resource usage. |

---

## 2. Detailed File Modifications

### A. [`apps/server/.env`](file:///d:/RS%20Prints/apps/server/.env)
- **Previous Configuration (Local Docker)**:
  ```env
  DB_HOST=localhost
  DB_PORT=6543
  DB_NAME=vendure
  DB_USERNAME=vendure
  DB_PASSWORD=v89gt6XIAlDX6P7vwKCrgg
  DB_SCHEMA=public
  ```
- **New Configuration (Neon PostgreSQL)**:
  ```env
  # Neon PostgreSQL Database Connection
  DATABASE_URL=postgresql://neondb_owner:npg_ex7WHUVOdSn5@ep-noisy-hill-aza7v7wx-pooler.c-3.ap-southeast-1.aws.neon.tech/medusadb?sslmode=require
  DB_SCHEMA=public
  # Automatically synchronize schema on startup (helpful when first connecting to an empty database)
  DB_SYNCHRONIZE=true
  ```

### B. [`apps/server/src/vendure-config.ts`](file:///d:/RS%20Prints/apps/server/src/vendure-config.ts)
- Configured TypeORM `dbConnectionOptions` to prioritize `DATABASE_URL` if present, while gracefully falling back to individual parameters if running against a local database:
  ```typescript
  dbConnectionOptions: {
      type: 'postgres',
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
  ```

### C. [`apps/server/src/environment.d.ts`](file:///d:/RS%20Prints/apps/server/src/environment.d.ts)
- Extended the `ProcessEnv` typings to keep code strictly type-safe:
  ```typescript
  declare global {
      namespace NodeJS {
          interface ProcessEnv {
              APP_ENV: string;
              VENDURE_SERVER_PORT: string;
              PORT: string;
              COOKIE_SECRET: string;
              SUPERADMIN_USERNAME: string;
              SUPERADMIN_PASSWORD: string;
              CORS_ORIGINS?: string;
              DATABASE_URL?: string;
              DB_HOST?: string;
              DB_PORT?: number;
              DB_NAME?: string;
              DB_USERNAME?: string;
              DB_PASSWORD?: string;
              DB_SCHEMA?: string;
              DB_SYNCHRONIZE?: string;
              DB_SSL?: string;
          }
      }
  }
  ```

### D. [`apps/server/docker-compose.yml`](file:///d:/RS%20Prints/apps/server/docker-compose.yml)
- Commented out the `postgres_db` service block:
  ```yaml
  # Postgres is now hosted on Neon DB (configured via DATABASE_URL in .env)
  # postgres_db:
  #     image: postgres:16-alpine
  #     volumes:
  #         - postgres_db_data:/var/lib/postgresql/data
  #     ports:
  #         - "6543:5432"
  #     environment:
  #         POSTGRES_DB: vendure
  #         POSTGRES_USER: vendure
  #         POSTGRES_PASSWORD: v89gt6XIAlDX6P7vwKCrgg
  #     labels:
  #         - "io.vendure.create.name=try-third-next"
  ```

---

## 3. Important Notes & Best Practices

1. **Schema Synchronization (`DB_SYNCHRONIZE`)**:
   - For an uninitialized / empty Neon database, `DB_SYNCHRONIZE=true` allows Vendure's TypeORM engine to construct the schema tables automatically on startup.
   - Once all tables and plugins are initialized, you can optionally set `DB_SYNCHRONIZE=false` and use Vendure migrations (`pnpm exec vendure migration:generate`) for subsequent schema modifications.

2. **SSL Configuration**:
   - Neon requires encrypted SSL connections (`sslmode=require`).
   - The config automatically detects `sslmode=require` in `DATABASE_URL` and passes `{ rejectUnauthorized: false }` to the underlying `pg` driver to prevent SSL certificate validation failures in Node.js environments.

3. **Reverting to Local Docker Postgres**:
   - If you ever need to revert to local Docker Postgres:
     1. Uncomment `postgres_db` in [`apps/server/docker-compose.yml`](file:///d:/RS%20Prints/apps/server/docker-compose.yml).
     2. In [`apps/server/.env`](file:///d:/RS%20Prints/apps/server/.env), comment out `DATABASE_URL` and re-enable `DB_HOST=localhost`, `DB_PORT=6543`, `DB_NAME=vendure`, `DB_USERNAME=vendure`, `DB_PASSWORD=...`.
     3. Start the container with `docker compose up -d postgres_db`.
