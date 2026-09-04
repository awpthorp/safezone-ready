# Infra

Wrangler configs live next to each app so `wrangler dev` and `wrangler deploy` have a project root:

- `apps/api/wrangler.toml`
- `apps/worker/wrangler.toml`
- `apps/web/wrangler.toml` (Cloudflare Pages)

D1 migrations in this folder are referenced by both Worker configs via `migrations_dir`.

```bash
export CLOUDFLARE_API_TOKEN=...
./infra/provision-staging.sh
```

Staging on the Clients account is already provisioned (see `infra/staging.json`). Re-run the script only to recreate missing pieces.

One DNS step is still manual: proxied CNAME `staging.safezoneready.com` → `safezone-ready-web.pages.dev`. The Wrangler OAuth grant can create Workers/Pages/D1/R2/Queues but cannot write DNS records.

Set secrets with `npx wrangler secret put NAME --config apps/api/wrangler.toml`.
Do not put production values in git.

## Domains

- Mothership: `safezoneready.com` (Pages + `/api/*`).
- Satellite: `metasafezone.com` is **redirect-only**. See [`redirects.md`](./redirects.md) and [`metasafezone-bulk-redirects.json`](./metasafezone-bulk-redirects.json).
- Do not attach `metasafezone.com` to this Pages project.
