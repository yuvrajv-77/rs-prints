# Migration Guide: Local PostgreSQL to Neon

This document describes the configuration changes for using Neon PostgreSQL with Vendure. **Never put live database URLs, passwords, API keys or other credentials in this file or in Git.**

## Environment configuration

Keep connection details in the ignored `apps/server/.env` file or in the deployment platform's secret manager.

Example only, with placeholders:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require
DB_SCHEMA=public
DB_SYNCHRONIZE=false
```

For a fresh disposable development database, schema synchronization may be enabled temporarily. For any database containing valuable data, keep synchronization disabled and use reviewed migrations.

## Vendure configuration

The Vendure configuration reads `DATABASE_URL` when supplied and enables SSL for Neon connections. See `apps/server/src/vendure-config.ts`.

## Security incident response

A previous version of this document contained database credentials. Treat every credential that appeared in the public Git history as compromised:

1. Rotate the Neon database role password immediately and update the deployment secret.
2. Rotate any local database password that was also committed and is still in use.
3. Review Neon connection history and database activity for unexpected access.
4. Purge the exposed values from Git history (for example with `git filter-repo`) and force-push the cleaned history after coordinating with collaborators. Deleting a value from the latest file does not remove it from old commits or forks.
5. Review repository history and logs for any other accidentally committed secrets.

Do not paste live credentials into issues, pull requests, chat, screenshots or source files.
