# Infra

Wrangler configs live next to each app so `wrangler dev` and `wrangler deploy` have a project root:

- `apps/api/wrangler.toml`
- `apps/worker/wrangler.toml`
- `apps/web/wrangler.toml` (Cloudflare Pages)

D1 migrations in this folder are referenced by both Worker configs via `migrations_dir`.

```bash
# After you create a real D1 database:
npx wrangler d1 create safezone-ready
# paste database_id into the wrangler files
npx wrangler d1 migrations apply safezone-ready --local
npx wrangler d1 migrations apply safezone-ready --remote --env staging

npx wrangler r2 bucket create szr-assets
npx wrangler queues create szr-fix-jobs
```

Set secrets with `npx wrangler secret put NAME --config apps/api/wrangler.toml`.
Do not put production values in git.
