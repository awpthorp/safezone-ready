# Domain redirects

Purchased on Cloudflare Registrar (4 September 2026). Apply these in the dashboard (or Bulk Redirects). Do not serve the React app from the satellite zone.

| Host | Role | Action |
| --- | --- | --- |
| `safezoneready.com` | Mothership / canonical | Pages + `/api/*` Worker |
| `www.safezoneready.com` | www alias | **301** to `https://safezoneready.com{path}{query}` |
| `staging.safezoneready.com` | Staging | Separate Pages alias + Worker env |
| `metasafezone.com` | Meta SEO satellite | **301** to mothership + `platform=meta` |
| `www.metasafezone.com` | Satellite www | **301** to mothership + `platform=meta` |

No other satellites are purchased. Do not create rules for `isitreadyforads.com` or similar.

## 1. Mothership: www to apex

On the **safezoneready.com** zone, or via Pages `public/_redirects` (this repo ships that file):

```text
https://www.safezoneready.com/*  https://safezoneready.com/:splat  301
```

Cloudflare Redirect Rule equivalent:

- If: `(http.host eq "www.safezoneready.com")`
- Then: dynamic redirect `concat("https://safezoneready.com", http.request.uri.path, if(http.request.uri.query ne "", concat("?", http.request.uri.query), ""))`
- Status: 301
- Preserve query: yes

Canonical tag on Pages: `https://safezoneready.com/`.

## 2. Meta satellite: always 301, never host the app

On the **metasafezone.com** zone only. Do **not** attach this hostname to the Pages project.

### Recommended: single Dynamic Redirect Rule

If:

```text
(http.host eq "metasafezone.com") or (http.host eq "www.metasafezone.com")
```

Then (dynamic destination):

```text
concat(
  "https://safezoneready.com",
  http.request.uri.path,
  if(http.request.uri.query eq "", "?platform=meta", concat("?", http.request.uri.query, "&platform=meta"))
)
```

Status: **301**. Place this rule first. Do not enable a 200 on the satellite.

Homepage becomes `https://safezoneready.com/?platform=meta`.  
`https://metasafezone.com/tools` becomes `https://safezoneready.com/tools?platform=meta`.  
If a path does not exist on the mothership, Pages 404s there (acceptable). Optional later: map unknown satellite paths to `/?platform=meta` only.

### Bulk Redirect list (if you prefer static rows)

Import as a Bulk Redirect list named `szr-meta-satellite` and attach it to `metasafezone.com`:

| Source | Target | Status | Parameters | subpath |
| --- | --- | --- | --- | --- |
| `https://metasafezone.com/` | `https://safezoneready.com/?platform=meta` | 301 | preserve none | |
| `https://www.metasafezone.com/` | `https://safezoneready.com/?platform=meta` | 301 | preserve none | |
| `https://metasafezone.com/*` | `https://safezoneready.com/:splat?platform=meta` | 301 | include subpath | yes |
| `https://www.metasafezone.com/*` | `https://safezoneready.com/:splat?platform=meta` | 301 | include subpath | yes |

JSON sketch (Bulk Redirect API): see `infra/metasafezone-bulk-redirects.json`.

## 3. What the mothership does with `?platform=`

Implemented in `apps/web` (`placementFromSearch`):

| Query | Selected overlay |
| --- | --- |
| `platform=meta` (and `reels`, `meta_reels`) | Meta Reels |
| `platform=stories` / `meta_stories` | Meta Stories |
| `platform=feed` / `meta_feed_4x5` | Meta Feed 4:5 |
| `platform=youtube` / `shorts` | YouTube Shorts |
| `platform=tiktok` | TikTok In-Feed |
| missing / `combined` | Strictest combined |

Score cards for every platform stay on screen. This is a deep link, not a Meta-only product.

## 4. Do not

- Add `metasafezone.com` to Google OAuth origins, Stripe URLs, Turnstile hostnames, or CORS.
- Set `Domain=.metasafezone.com` cookies.
- Dual-publish sitemap or `rel=canonical` to the satellite.
- Claim affiliation with Meta in satellite ads. The 301 landing page still carries the mothership disclaimer.
- Wire hypothetical extra satellites until Alex purchases them.

## 5. DNS checklist

**safezoneready.com**

- Proxied CNAME/ALIAS for apex and `www` to Cloudflare Pages.
- `staging` CNAME to the staging Pages project.
- Worker route `safezoneready.com/api/*`.

**metasafezone.com**

- Proxied dummy A/AAAA or orange-cloud CNAME so Redirect Rules execute (a proxied `A 192.0.2.1` placeholder is enough if there is no origin).
- No Pages custom domain.
- Orange cloud required (Redirect Rules do not run if DNS is grey-cloud).

## 6. HSTS

Enable HSTS on `safezoneready.com` after HTTPS is confirmed. Skip preload until www 301 is proven. Do not preload `metasafezone.com`.
