# Gemini cost vs credit packs

Source: [Gemini Developer API pricing](https://ai.google.dev/gemini-api/docs/pricing), checked 4 September 2026. USD list prices. GBP figures use a **planning** rate of £0.75 per $1 (not a live FX quote). Re-check Google’s page before you create Stripe Prices.

## What Google charges for the models we use

| Model | Role in our pipeline | Paid image **output** | Notes |
| --- | --- | --- | --- |
| `gemini-3.1-flash-image` (Nano Banana 2) | Default edit | **$0.067 / 1K**, $0.101 / 2K, $0.151 / 4K | Input text/image $0.50 per 1M tokens (a still is cents). No free tier on the paid API contract. |
| `gemini-3-pro-image` (Nano Banana Pro) | One escalation if verify fails | **$0.134 / 1K or 2K**, $0.24 / 4K | Input $2 per 1M tokens (~$0.001 per still). |
| Text / vision (analyse + verify) | Should **not** be an image-generation model | ~$0.01 or less if we use a Flash text model | If we mistakenly call Flash Image just to extract JSON, we still only pay input + text out, not a second $0.067, as long as we do not request an output image. |

Batch API is roughly half those image rates. We will not use batch for interactive fixes.

**Normative MVP default:** `GEMINI_IMAGE_SIZE=1K`. 1080×1920 stills are close to 2K pixels; asking for 1K is cheaper and enough for Ads Manager. Do not enable 4K in MVP.

## Cost of one credit (our graph)

| Path | Calls | Est. Gemini COGS | Est. £ |
| --- | --- | --- | --- |
| Happy: analyse (text) + Flash 1K edit + verify (text) | 1 image out | **~$0.08** | **~£0.06** |
| Same at 2K output | 1 image out | ~$0.12 | ~£0.09 |
| Flash fails verify, one Pro 1K/2K edit | 2 image outs | **~$0.22–0.25** | **~£0.17–0.19** |
| Hard fail (we refund the credit) | same as above | we eat COGS | no revenue |
| CPU pad fallback | 0 extra image outs | ~$0 | ~£0 |

Cloudflare Workers / R2 / Queue are noise next to Gemini at this volume.

Two complimentary fixes: worst case about **$0.50** of Gemini if both escalate. Acceptable CAC. The spam control is still Google OAuth + caps, not the free-tier cost.

## What that means for £9 / 20 and £29 / 80

| Pack | Price | £ / credit | Happy-path gross (after ~£0.06 COGS) | Pro-path gross (after ~£0.18) |
| --- | --- | --- | --- | --- |
| Starter | **£9 / 20** | £0.45 | ~87% | ~60% |
| Studio | **£29 / 80** | £0.36 | ~83% | ~50% |

Stripe UK card: roughly 1.5% + 20p per Checkout. On £9 that is ~£0.34, or ~£0.017 per credit. Still fine.

**Recommendation: keep £9 / 20 and £29 / 80** if we:

1. Default to **1K**, not 2K/4K.
2. Run analyse + verify on a **text** Gemini model, not a second image generation.
3. Escalate to Pro **once**, then pad, then refund.
4. Watch live metrics. Raise the pack or cut credits if Pro rate > ~35% or refund rate > ~20% for a week.

If you want a simpler “I do not want to think about Pro”, sell **£12 / 20**. That is optional. The original hypotheses already cover a Pro-heavy job on Starter.

Do not print these margins in marketing. They are planning maths, not a forecast of volume.

## What a credit must cover

One credit = one job that may do Flash + Pro + pad. User is not billed per model call. That is why 1K default and a single escalation matter.
