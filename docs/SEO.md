# Search and satellite plan

One product. One canonical URL. Satellites exist only to catch the query, then send the buyer home.

## Canonical

`https://safezoneready.com/` is the mothership.

Every indexable page must include:

```html
<link rel="canonical" href="https://safezoneready.com/{path}" />
```

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
https://metasafezone.com/                 → 301 https://safezoneready.com/?platform=meta
https://metasafezone.com/*                → 301 https://safezoneready.com/?platform=meta
https://www.metasafezone.com/*            → 301 https://safezoneready.com/?platform=meta
```

Do not host the app on the satellite. Do not put it in CORS, OAuth, Stripe, or Turnstile. Do not brand the product as “Meta Safe Zone”.

Apply these as Cloudflare Redirect Rules on the `metasafezone.com` zone. Status is documented in `infra/redirects.md`.

## Pages to ship (indexable)

| Path | Title (aim) | Who it is for |
| --- | --- | --- |
| `/` | Check if Instagram, TikTok or YouTube will cover your ad \| Safe Zone Ready | The tool. Drop a still. See the cover. |
| `/meta` or `/?platform=meta` | Instagram Reels and Stories safe zone checker | Satellite landing. Same tool, Meta selected. |
| `/youtube-shorts` | YouTube Shorts safe zone checker | Shorts buyers. |
| `/tiktok` | TikTok in-feed safe zone checker | TikTok buyers. |
| `/privacy` | Privacy | Legal. |
| `/terms` | Terms | Legal. |

Each platform page is a thin wrapper around the same checker with that placement selected, plus a short explainer above the fold. Same canonical host. No duplicate tool on another domain.

## On-page basics (must exist)

- Unique title and meta description per page
- Open Graph + Twitter cards with a real still that shows covered text
- `robots.txt` allowing `/`, blocking `/api` and staging
- `sitemap.xml` listing the pages above
- FAQ JSON-LD on `/` (three questions a buyer would ask)
- Fast first paint. The checker is the page. Do not hide it behind a blog.

## Off-page (later)

- One honest how-to on the mothership: “Where Instagram puts the caption on Reels”
- Answer the same question on YouTube and TikTok pages
- Do not spam satellite blogs. One domain, one story.

## Do not put in titles or snippets

Gemini. SynthID. Occupancy. Ink. Chrome. Guardrail pack. Spam control. Affiliation disclaimers. Those belong in legal, not search.
