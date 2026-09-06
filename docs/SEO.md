# Search and satellite plan

One product. One canonical URL. Satellites exist only to catch the query, then send the buyer home.

## Canonical

`https://safezoneready.com/` is the mothership.

Every indexable page must include:

```html
<link rel="canonical" href="https://safezoneready.com/{path}" />
```

Home is `https://safezoneready.com/`. Other paths have no trailing slash. Never canonicalise to staging, `pages.dev`, or `metasafezone.com`.

`www.safezoneready.com` 301s to the apex. Staging stays `noindex`.

## What people actually type

They do not type “occupancy penalty” or “guardrail pack”. They type things like:

- Instagram Reels safe zone
- Meta Stories text covered
- YouTube Shorts safe area
- TikTok caption covering my ad
- check if my ad will be cropped
- Facebook ad safe zone 4x5
- Reels CTA button overlay

Title and description must answer that in their words.

## Satellite: metasafezone.com

Purpose: rank for Meta / Instagram / Facebook safe-zone queries, then 301 to the mothership with the Meta Reels check already selected.

```
https://metasafezone.com/                 → 301 https://safezoneready.com/meta
https://metasafezone.com/*                → 301 https://safezoneready.com/meta
https://www.metasafezone.com/*            → 301 https://safezoneready.com/meta
```

`/?platform=meta` on the mothership still replace-navigates to `/meta`.

Do not host the app on the satellite. Do not put it in CORS, OAuth, Stripe, or Turnstile. Do not brand the product as “Meta Safe Zone”.

Apply these as Cloudflare Redirect Rules on the `metasafezone.com` zone. Status is documented in `infra/redirects.md`.

## Pages shipped (indexable)

| Path | Title | Who it is for |
| --- | --- | --- |
| `/` | Check if Instagram, TikTok or YouTube will cover your ad \| Safe Zone Ready | The tool. Drop a still. See the cover. |
| `/meta` | Instagram Reels and Stories safe zone checker \| Safe Zone Ready | Satellite landing. Same tool, Reels selected. |
| `/youtube-shorts` | YouTube Shorts safe zone checker \| Safe Zone Ready | Shorts buyers. |
| `/tiktok` | TikTok in-feed safe zone checker \| Safe Zone Ready | TikTok buyers. |
| `/privacy` | Privacy \| Safe Zone Ready | Legal. |
| `/terms` | Terms \| Safe Zone Ready | Legal. |

Each platform page is a thin wrapper around the same checker with that placement selected, plus a short explainer above the fold. Same canonical host. No duplicate tool on another domain.

Legacy query tokens (`?platform=stories`, `feed`, and so on) still select an overlay if someone lands with them. They are not sitemap URLs.

## On-page basics (must exist)

- Unique title and meta description per page
- Open Graph + Twitter cards with a real still that shows covered text (`/og.png`, 1200x630)
- `robots.txt` allowing `/`, blocking `/api`. Staging is `noindex` via `_headers` and a host check, not robots.txt
- `sitemap.xml` listing the path URLs above (not `?platform=`)
- FAQ JSON-LD on `/` (three questions a buyer would ask). Google retired FAQ rich results in May 2026; still include the markup
- Fast first paint. The checker is the page. Do not hide it behind a blog
- Prerendered HTML in `dist/{path}/index.html` so crawlers that skip JavaScript still see the H1 and copy

## Off-page (later)

- One honest how-to on the mothership: where Instagram puts the caption on Reels (`/meta`)
- Answer the same question on YouTube and TikTok pages
- Do not spam satellite blogs. One domain, one story

## Do not put in titles or snippets

Gemini. SynthID. Occupancy. Ink. Chrome. Guardrail pack. Spam control. Affiliation disclaimers. Those belong in legal, not search.

Launch operations (Search Console, analytics tokens, HSTS) live in `docs/LAUNCH.md`.
