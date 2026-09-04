# Safe Zone Ready

Working name: **Safe Zone Ready** (`safezone-ready`).  
Private freemium product: score Meta / YouTube Shorts / TikTok safe zones locally, then optionally AI-edit a still so offer text, logos, and CTAs stay visible.

This is **not** part of Posterly. The only Posterly link is a soft upsell after download.

Canonical spec: [`docs/SPEC.md`](./docs/SPEC.md)  
Threat model: [`docs/SECURITY.md`](./docs/SECURITY.md)

**Product / mothership:** [Safe Zone Ready](https://safezoneready.com) at `safezoneready.com` (Cloudflare Registrar, 4 Sep 2026).  
**Meta SEO satellite:** `metasafezone.com` 301s to `https://safezoneready.com/?platform=meta`. Do not host the app there. See [`infra/redirects.md`](./infra/redirects.md). Other satellites are not purchased.

## What works in this repo

- Deterministic overlay checker in `apps/web` (FileReader, no upload).
- `@safezone-ready/safezone-specs` geometry, scores, occupancy heuristic, unit tests.
- Hono API stubs: health, OAuth placeholders, checkout, fix job, Turnstile, rate-limit hooks.
- Queue worker stub documenting the Gemini Interactions call shape and verify loop.
- D1 migration, Wrangler configs, GitHub Actions CI, `.env.example`.

What is **not** live: Google OAuth, Stripe, Gemini, R2, production deploy. Those need secrets from Alex.

## Repo layout

```text
apps/web                 Cloudflare Pages (Vite + React)
apps/api                 Hono Worker
apps/worker              Queue consumer
packages/safezone-specs  JSON placements + pure TS scorer
docs/SPEC.md
docs/SECURITY.md
infra/migrations
infra/redirects.md
.env.example
```

## Local run

Requires Node 20+ and [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm test
pnpm --filter @safezone-ready/web dev
```

The checker is at [http://127.0.0.1:43173](http://127.0.0.1:43173). Drop a PNG/JPEG/WebP or use the sample still. Scoring stays in the browser.

Optional API (stubs, no secrets):

```bash
pnpm --filter @safezone-ready/api dev
curl http://127.0.0.1:8787/api/health
```

Copy `.env.example` to `apps/api/.dev.vars` and `apps/worker/.dev.vars` when you add keys. `TURNSTILE_BYPASS=1` is local-only.

## Tests and CI

```bash
pnpm test          # safezone-specs
pnpm typecheck
pnpm --filter @safezone-ready/web build
```

GitHub Actions (`.github/workflows/ci.yml`) runs the same gates. Origin is the source of truth. Keep the workflow so a later GitHub mirror is drop-in. Do not add a Vercel project for this app.

## Connect Stripe, Google, Gemini, Cloudflare

Do this on **staging** first. Never commit values.

### 1. Cloudflare

1. Create a Pages project from this repo (`apps/web` build: `pnpm --filter @safezone-ready/web build`, output `apps/web/dist`).
2. `npx wrangler d1 create safezone-ready` and paste `database_id` into both Worker `wrangler.toml` files.
3. `npx wrangler d1 migrations apply safezone-ready --remote --env staging`
4. `npx wrangler r2 bucket create szr-assets` and add an object lifecycle of 24–72 hours.
5. `npx wrangler queues create szr-fix-jobs`
6. Deploy API: `pnpm --filter @safezone-ready/api deploy -- --env staging`
7. Deploy worker: `pnpm --filter @safezone-ready/worker deploy -- --env staging`
8. Preferred routing: `https://safezoneready.com/api/*` → API Worker, Pages for the rest (first-party cookies).
9. Turn on WAF, Bot Fight, and Rate Limiting on `/api/fix`, `/api/uploads`, `/api/auth/*` (see SPEC §14).
10. Create a Turnstile widget. Set `VITE_TURNSTILE_SITE_KEY` on Pages and `TURNSTILE_SECRET_KEY` on the API. Production must have `TURNSTILE_BYPASS=0`.
11. Attach Pages custom domains `safezoneready.com` and `www.safezoneready.com`. Apply satellite 301s from [`infra/redirects.md`](./infra/redirects.md) on the `metasafezone.com` zone. Do not add the satellite to CORS, OAuth, or Stripe.

### 2. Google OAuth

1. Google Cloud console → OAuth client (Web).
2. Redirect: `https://safezoneready.com/api/auth/callback` (and local `http://127.0.0.1:8787/api/auth/callback`). Authorised origins: apex, www, staging, localhost. Not `metasafezone.com`.
3. Scopes: `openid email profile` only.
4. `wrangler secret put GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

### 3. Gemini

1. Create an API key in Google AI Studio / Cloud.
2. `wrangler secret put GEMINI_API_KEY` on **`apps/worker` only**.
3. Models (defaults): `gemini-3.1-flash-image`, escalation `gemini-3-pro-image`.
4. There is no `/api/gemini`. If you see one, it is a bug.
5. All Gemini images carry SynthID. Keep the UI disclosure.

### 4. Stripe

1. Test mode first. Prefer a [restricted API key](https://docs.stripe.com/keys/restricted-api-keys).
2. Products: Starter pack (hypothesis £9 / 20 credits), Studio pack (hypothesis £29 / 80). Confirm with Alex before marketing.
3. `wrangler secret put STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET STRIPE_PRICE_STARTER STRIPE_PRICE_STUDIO`
4. Webhook URL: `https://safezoneready.com/api/webhooks/stripe`. Events: `checkout.session.completed` (required), `charge.refunded` (log).
5. Checkout Sessions: `mode=payment`, **omit** `payment_method_types`, use `StripeClient`, add `integration_identifier`.
6. Do not enable `automatic_tax` until a Stripe Tax registration is active.
7. Customer Portal for “Manage billing”.

### 5. Domain (purchased)

1. Mothership `safezoneready.com` is live on Cloudflare Registrar. Set `APP_ORIGIN=https://safezoneready.com`.
2. `www.safezoneready.com` 301s to the apex (Pages `_redirects`).
3. `metasafezone.com` + `www` 301 to `https://safezoneready.com/?platform=meta` (zone Redirect Rules, not a second Pages app).
4. Flip `FIXES_ENABLED` only when staging e2e is green.

## Next steps for Alex

1. Attach Pages + `/api` routes on `safezoneready.com` and apply the satellite 301s (checklist in `infra/redirects.md`).
2. Confirm SKU prices (still hypotheses).
3. Put Google / Stripe test / Gemini / Turnstile secrets in Wrangler.
4. Deploy Workers + Pages to `staging.safezoneready.com`. Do not claim production until that is done.
5. Counsel for Privacy Policy and Terms (retention, Google as Gemini sub-processor).
6. Decide whether 2 free fixes per Google account is acceptable abuse risk.

## Product principles (short)

- Local check is unlimited and upload-free.
- Credits, not seats, for MVP.
- Auth before any AI fix.
- Preserve-verify; refund the credit on hard fail.
- Approximate guardrails, not platform certification.
- British English in the UI. No em dashes.
