# Safe Zone Ready — context for this folder

Read this before you edit anything. Canonical product spec is `docs/SPEC.md`. This file is the short version for a human or an agent sitting in this repo.

## What this is

A freemium check for ad stills. Drop a PNG, JPEG or WebP. See where Instagram, TikTok and YouTube will cover the offer. Optionally pay to move the offer so captions and buttons do not sit on it.

Working name in code: Safe Zone Ready / `safezone-ready`.  
Product site: https://safezoneready.com  
Staging: https://staging.safezoneready.com  
Origin: https://cursor.com/codebase/athorp/safezone-ready  
GitHub (laptop remote): https://github.com/awpthorp/safezone-ready

This is not Posterly. Soft link to poster.ly after download only. Never put this inside `awpthorp/posterly`.

## Who uses it

A media buyer about to spend. They do not want “ink in chrome 70”, Gemini, SynthID, occupancy, guardrail packs, or affiliation dumps in the header. They want “Instagram Reels will cover it. Text sits under the caption and buttons.”

## Hard rules

- British English in all user-facing copy. No em dashes.
- Images only for MVP. No video, teams, Figma, or Ads Manager push.
- Free check is local (`FileReader`). Nothing uploads for a score.
- Auth (Google) before the first AI fix. Two free fixes per account, then Stripe packs (£9 / 20, £29 / 80).
- Scores are practical overlays, not platform certification.
- Do not brand the product “Meta Safe Zone”. `metasafezone.com` is SEO only. It 301s to `https://safezoneready.com/?platform=meta`. Do not host the app there. Do not put that host in CORS, OAuth, Stripe or Turnstile.
- `www.safezoneready.com` 301s to the apex.
- Affiliation, SynthID, 72h retention: legal footer or legal pages only. Not the tool chrome.
- No public Gemini proxy. Key lives on the Worker only.
- No live secrets in git.

## Stack (this product)

Copy this block into the next repo when you start something similar.

| Need | We use |
| --- | --- |
| Web | Vite, React, TypeScript, Tailwind, shadcn/ui on Cloudflare Pages |
| API | Hono on a Cloudflare Worker. Prefer `https://host/api/*` same origin |
| Jobs | Cloudflare Queues + a second Worker |
| Files | R2 with a short TTL |
| Ledger / users | D1 |
| Abuse | WAF, Bot Fight, Turnstile, rate limits |
| Identity | Google OAuth (openid email profile) |
| Money | Stripe Checkout credit packs, test mode first |
| Image AI | Gemini Flash Image, one Pro escalation, then pad, then refund |
| Domains | Cloudflare Registrar. One mothership. Satellites are 301s |
| Git | Origin is source of truth. Trunk on `main`. GitHub is a laptop remote you add |
| Package manager | pnpm workspaces |
| Copy | British English. Buyer words on the tool |

Escape hatches, do not start here: Railway only if the Worker cannot finish a Gemini job. Supabase Auth only if sessions get hard. Never Vercel as the mothership for this family of products.

## Repo map

```text
apps/web                 Checker UI. Port 43173
apps/api                 Hono Worker stubs
apps/worker              Gemini pipeline stub
packages/safezone-specs  Overlay geometry, scorer, buyer copy
docs/SPEC.md             Canonical spec
docs/SECURITY.md         Threat model
docs/PRICING.md          Gemini cost vs packs
docs/SEO.md              Satellites and search
infra/                   D1 migration, redirects, staging ids
CONTEXT.md               This file
```

## Run locally

Needs Node 20+ and pnpm.

```bash
pnpm install
pnpm test
pnpm --filter @safezone-ready/web dev
```

Checker: http://127.0.0.1:43173  
Sample still is meant to fail on Feed / Every app (offer in the caption band).

```bash
pnpm --filter @safezone-ready/api dev
curl http://127.0.0.1:8787/api/health
```

Copy `.env.example` to `apps/api/.dev.vars` and `apps/worker/.dev.vars` when you add keys. Never commit values.

## What is live vs stub

Live: local overlay check, scores, buyer copy, staging Pages + API health on Cloudflare Clients (`alex@gr.agency`).  
Stub until secrets: Google OAuth, Stripe, Gemini edits, R2 uploads. Fix UI is a mock.

Staging ids: `infra/staging.json`. Custom domain: https://staging.safezoneready.com

## Copy and scoring

Buyer labels live in `packages/safezone-specs/src/copy.ts`.  
Grades on screen: Ready / Tight / Covered.  
Never print occupancy, ink, chrome, spec versions, or “at_risk” in the UI.  
`?platform=meta` selects Instagram Reels (satellite deep link).

## If you are an agent

- Match the stack above. Do not add a second component library, a database, or auth unless the task needs it.
- User-facing strings: British English, no em dashes, no engineer jargon on the tool.
- Do not invent Stripe or Gemini keys.
- Do not merge other GitHub repos into this tree.
- Prefer one complete slice over a platform of unused features.
- After UI changes, check the flow in the browser (drop / sample, placements, fix card, footer).

## Docs index

| File | Open when |
| --- | --- |
| `CONTEXT.md` | You just sat down |
| `README.md` | How to run and wire secrets |
| `docs/SPEC.md` | Product, data model, placements, pipeline |
| `docs/SECURITY.md` | Abuse, retention, incident |
| `docs/PRICING.md` | Pack maths |
| `docs/SEO.md` | Titles, satellites, sitemap |
| `infra/redirects.md` | Domain 301s |
| `infra/README.md` | Wrangler / staging |
