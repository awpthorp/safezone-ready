# Launch checklist: get Safe Zone Ready onto the wider internet

Canonical host: `https://safezoneready.com` (apex). Staging: `https://staging.safezoneready.com`. Satellite: `metasafezone.com` 301s to `/meta`.

This is the operational list. Code in this change ships pages, unique meta, schema, legal, prerendered HTML, robots, sitemap, OG, and env-gated analytics. It does not attach the production domain, create Google properties, or put secrets in Wrangler.

## 1. Domain and HTTPS

- [x] Cloudflare Pages project `safezone-ready-web` (Clients account). Staging custom domain is live.
- [x] Custom domains on Pages: `safezoneready.com` and `www.safezoneready.com`.
- [x] Apex and `www` CNAME (proxied) to `safezone-ready-web.pages.dev`. GSC TXT is on the apex.
- [ ] Confirm `https://www.safezoneready.com/` 301s to `https://safezoneready.com/` (repo `_redirects`; may only apply once both custom domains show Active)
- [x] `metasafezone.com` and `www` 301 to `https://safezoneready.com/meta` via Worker `szr-meta-redirect`
- [x] `staging.safezoneready.com` CNAME to Pages; `noindex`
- [x] HSTS `max-age=31536000; includeSubDomains` on the mothership. Do not preload yet.

Dashboards: [Cloudflare Registrar](https://dash.cloudflare.com/?to=/:account/registrar), [DNS](https://dash.cloudflare.com/?to=/:account/zones), [Pages custom domains](https://dash.cloudflare.com/?to=/:account/pages).

## 2. Indexability

Shipped in this change:

- `robots.txt` allows `/`, blocks `/api`, allows GPTBot / OAI-SearchBot / ClaudeBot / PerplexityBot / Google-Extended
- `sitemap.xml` lists `/`, `/meta`, `/youtube-shorts`, `/tiktok`, `/privacy`, `/terms` (path URLs only)
- Per-page canonical tags to `https://safezoneready.com{path}` (no trailing slash except home)
- Staging and `*.pages.dev` send `X-Robots-Tag: noindex, nofollow`; `main.tsx` also injects noindex on those hosts
- Prerendered `dist/{path}/index.html` so crawlers that skip JavaScript still see unique titles, H1s and body copy
- Unknown paths serve `404.html` with `noindex` (not a 200 of the homepage)

Still a dashboard click:

- [ ] [Google Search Console](https://search.google.com/search-console): add a **Domain** property `safezoneready.com` (DNS TXT on Cloudflare)
- [ ] Do not use a URL-prefix property that includes `www` as the only property
- [ ] Submit `https://safezoneready.com/sitemap.xml`
- [ ] Request indexing for `/` and `/meta` after the first good crawl
- [ ] Confirm staging and Pages preview URLs stay out of the index
- [ ] Inspect live URL: canonical, robots, OG image 1200x630

## 3. Analytics

Env vars (web / Pages only). Empty means no script is loaded.

| Variable | What it does |
| --- | --- |
| `VITE_CF_BEACON_TOKEN` | Cloudflare Web Analytics beacon (cookieless) |
| `VITE_GA_MEASUREMENT_ID` | GA4 `G-...` via gtag. Optional. UK/EU may need a cookie notice before this goes live |
| `VITE_GOOGLE_SITE_VERIFICATION` | `<meta name="google-site-verification">` if you prefer HTML tag over DNS TXT |

- [x] DataFast on the mothership only (`safezoneready.com` and `www`). Website id `dfid_YmcRcHzFPY2hogFvefTFA`. Staging, `*.pages.dev` and localhost do not load the script. Counts start when apex DNS is live.
- [ ] Prefer Cloudflare Web Analytics first: [Web Analytics](https://dash.cloudflare.com/?to=/:account/web-analytics) on the mothership zone. Paste the token into Pages env as `VITE_CF_BEACON_TOKEN` and rebuild
- [ ] Optional GA4: [analytics.google.com](https://analytics.google.com). Create a GA4 property, web stream for `https://safezoneready.com`. Do not enable until counsel is happy with a cookie notice
- [ ] Search Console verification: DNS TXT (preferred) or `VITE_GOOGLE_SITE_VERIFICATION`

## 4. On-page SEO

Shipped:

- Unique title, description, H1 per indexable page
- Open Graph + Twitter `summary_large_image` with `https://safezoneready.com/og.png`
- JSON-LD: Organization, WebSite, SoftwareApplication/WebApplication (price 0 GBP for the local check), WebPage, FAQPage on `/` only, BreadcrumbList on inner pages. No HowTo. No fake AggregateRating
- `llms.txt`, `site.webmanifest`, `.well-known/security.txt`
- Visible FAQ on `/` matching the FAQ JSON-LD

- [ ] After deploy, [Rich Results Test](https://search.google.com/test/rich-results) on `/` and `/meta` (FAQ rich results were retired by Google in May 2026; still ship the markup)
- [ ] [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) and a private Slack/iMessage share to confirm the OG still

## 5. Google accounts

- [ ] Search Console domain property (above)
- [ ] Optional GA4 property (above)
- [ ] OAuth client for the product (not this change): [Google Cloud credentials](https://console.cloud.google.com/apis/credentials). Redirect `https://safezoneready.com/api/auth/callback`. Authorised origins: apex, www, staging, localhost. Not `metasafezone.com`
- [ ] Gemini API key later, Worker-only: [Google AI Studio](https://aistudio.google.com/apikey). Never `VITE_`

## 6. Bing Webmaster + IndexNow (optional)

- [ ] [Bing Webmaster](https://www.bing.com/webmasters): import from Search Console or DNS verify
- [ ] Submit the same sitemap
- [ ] Optional [IndexNow](https://www.indexnow.org/) key on the zone later. Not required for first index

## 7. Legal

Shipped: `/privacy` and `/terms` from SPEC §15-16. Controller is "the operator of safezoneready.com". No invented company number, ICO number, street address or email.

- [ ] Counsel review of Privacy and Terms before paid processing
- [ ] Publish a contact mailbox on `/privacy` before Stripe goes live
- [ ] Cookie notice if GA4 is enabled for UK/EU visitors
- [ ] Confirm SynthID and affiliation copy (footer + legal + FixPanel done state)

## 8. Security (Alex / dashboard)

- [ ] WAF, Bot Fight, Rate Limiting on `/api/fix`, `/api/uploads`, `/api/auth/*` ([Security](https://dash.cloudflare.com/?to=/:account/security))
- [ ] Turnstile widget; `TURNSTILE_BYPASS=0` in production
- [ ] Worker route `safezoneready.com/api/*`

## 9. Product secrets (still blocked on Alex)

Do not invent values. Staging first.

- [ ] `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- [ ] Stripe test keys, prices, webhook (`docs/PRICING.md`)
- [ ] `GEMINI_API_KEY` on `apps/worker` only
- [ ] Turnstile site + secret
- [ ] `SESSION_SECRET`, `IP_HASH_SECRET`

Dashboards: [Stripe](https://dashboard.stripe.com), [Google Cloud](https://console.cloud.google.com), [AI Studio](https://aistudio.google.com/apikey), [Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile).

## 10. Off-page later

- One how-to already lives on `/meta` (where Reels puts the caption). Shorts and TikTok pages answer the same question for those surfaces
- Do not spam satellite blogs. One domain, one story
- `metasafezone.com` must remain a 301, never a second app

## 11. What this change shipped vs what still needs a dashboard click

**Shipped in git**

- Routes: `/`, `/meta`, `/youtube-shorts`, `/tiktok`, `/privacy`, `/terms`, plus a client 404
- Query `?platform=meta|reels|youtube|shorts|tiktok` on `/` replace-navigates to the pretty path
- Unique titles, descriptions, canonicals, OG, Twitter, JSON-LD
- Prerendered static HTML inside `#root` after `vite build`
- robots, sitemap, `_headers`, `_redirects`, `llms.txt`, `security.txt`, webmanifest, `og.png` 1200x630, apple-touch icon
- Env-gated analytics plumbing (no tokens in the repo)
- Legal pages. SPEC Phase 3 "Legal pages" ticked

**Still a click / a secret**

- Attach production Pages custom domains and `/api/*`
- Satellite Redirect Rules on `metasafezone.com`
- Search Console + sitemap submit
- Analytics tokens
- OAuth, Stripe, Gemini, Turnstile
- Counsel, mailbox, optional cookie notice
- HSTS (later, no preload yet)
