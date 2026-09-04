import { Hono } from "hono";
import type { ApiEnv } from "./env";
import { fixesEnabled } from "./env";
import { corsGuard } from "./middleware/cors";
import { rateLimit } from "./middleware/rateLimit";
import { requireTurnstile } from "./middleware/turnstile";
import { requireSession } from "./middleware/authz";

const app = new Hono<{ Bindings: ApiEnv }>();

app.use("*", corsGuard);

app.get("/api/health", rateLimit({ limit: 60, windowMs: 60_000, key: "ip" }), (c) => {
    return c.json({
    ok: true,
    service: "safezone-ready-api",
    product: "Safe Zone Ready",
    mothership: "https://safezoneready.com",
    environment: c.env.ENVIRONMENT,
    fixesEnabled: fixesEnabled(c.env),
    models: {
      primary: c.env.GEMINI_MODEL_PRIMARY,
      escalation: c.env.GEMINI_MODEL_ESCALATION,
    },
    spec: "see docs/SPEC.md",
  });
});

app.get("/api/auth/google", rateLimit({ limit: 10, windowMs: 15 * 60_000, key: "ip" }), requireTurnstile, (c) => {
  if (!c.env.GOOGLE_CLIENT_ID) {
    return c.json(
      {
        error: "oauth_not_configured",
        message: "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
        next: "See README.md and docs/SPEC.md §10.",
      },
      501,
    );
  }
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", c.env.GOOGLE_CLIENT_ID);
  url.searchParams.set("redirect_uri", `${c.env.API_PUBLIC_URL}/api/auth/callback`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", "stub-pkce-state");
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("code_challenge", "stub-challenge");
  return c.redirect(url.toString(), 302);
});

app.get("/api/auth/callback", rateLimit({ limit: 20, windowMs: 15 * 60_000, key: "ip" }), (c) => {
  const err = c.req.query("error");
  if (err) {
    return c.redirect(`${c.env.APP_ORIGIN}/?auth=error`, 302);
  }
  return c.json({
    stub: true,
    message: "OAuth callback placeholder. Exchange the code, upsert users, grant 2 welcome credits, set szr_session.",
  });
});

app.post("/api/turnstile/verify", rateLimit({ limit: 20, windowMs: 15 * 60_000, key: "ip" }), requireTurnstile, (c) => {
  return c.json({ ok: true, stub: isBypass(c.env.TURNSTILE_BYPASS) });
});

app.post(
  "/api/uploads",
  requireSession,
  rateLimit({ limit: 3, windowMs: 5 * 60_000, key: "user" }),
  requireTurnstile,
  async (c) => {
    return c.json({
      stub: true,
      assetId: "asset_stub",
      uploadUrl: null,
      message: "Would mint a 10-minute signed R2 PUT after MIME allowlist. Client PUTs bytes; we never accept a public Gemini proxy.",
      constraints: {
        mime: ["image/png", "image/jpeg", "image/webp"],
        maxBytes: 20 * 1024 * 1024,
        maxLongEdge: 8192,
        minShortEdge: 320,
      },
    });
  },
);

app.post(
  "/api/fix",
  requireSession,
  rateLimit({ limit: 2, windowMs: 5 * 60_000, key: "user" }),
  requireTurnstile,
  async (c) => {
    if (!fixesEnabled(c.env)) {
      return c.json(
        {
          error: "fixes_paused",
          message: "AI fixes are paused. Local overlay checks still work.",
        },
        503,
      );
    }
    const idempotency = c.req.header("Idempotency-Key");
    let body: Record<string, unknown> = {};
    try {
      body = await c.req.json();
    } catch {
      body = {};
    }
    return c.json({
      stub: true,
      jobId: "job_stub",
      status: "queued",
      idempotencyKey: idempotency ?? null,
      debit: "Would debit 1 credit in one D1 transaction before FIX_QUEUE.send",
      accepted: {
        assetId: body.assetId ?? null,
        placementIds: body.placementIds ?? ["combined"],
      },
      message: "Fix jobs are stubbed until Gemini, R2, and D1 secrets are set.",
    });
  },
);

app.get("/api/jobs/:id", requireSession, rateLimit({ limit: 60, windowMs: 60_000, key: "user" }), (c) => {
  const id = c.req.param("id");
  return c.json({
    stub: true,
    id,
    status: "queued",
    message: "Owner-only job read. Return 404 if row.user_id !== session.user_id.",
  });
});

app.post(
  "/api/checkout/session",
  requireSession,
  rateLimit({ limit: 8, windowMs: 60 * 60_000, key: "user" }),
  requireTurnstile,
  async (c) => {
    if (!c.env.STRIPE_SECRET_KEY) {
      return c.json(
        {
          error: "stripe_not_configured",
          message: "Stripe is not configured. Use test mode keys in .dev.vars.",
          skus: [
            { code: "pack_starter", hypothesis: "£9 / 20 fixes", credits: Number(c.env.STRIPE_STARTER_CREDITS) },
            { code: "pack_studio", hypothesis: "£29 / 80 fixes", credits: Number(c.env.STRIPE_STUDIO_CREDITS) },
          ],
        },
        501,
      );
    }
    return c.json({
      stub: true,
      message:
        "Would create a Checkout Session with StripeClient, mode=payment, no payment_method_types, integration_identifier szr_pack_<rand8>.",
    });
  },
);

app.post(
  "/api/billing/portal",
  requireSession,
  rateLimit({ limit: 8, windowMs: 60 * 60_000, key: "user" }),
  (c) => {
    return c.json({
      stub: true,
      message: "Would create a Stripe Customer Portal session for users.stripe_customer_id.",
    });
  },
);

app.post("/api/webhooks/stripe", async (c) => {
  const signature = c.req.header("stripe-signature");
  if (!c.env.STRIPE_WEBHOOK_SECRET || !signature) {
    return c.json(
      {
        error: "webhook_unverified",
        message: "Stripe webhook signature required. Never grant credits from the browser.",
      },
      400,
    );
  }
  return c.json({
    stub: true,
    message: "Verify with constructEvent, INSERT stripe_events.id, then grant pack credits. Dedupe on conflict.",
  });
});

app.all("/api/gemini", (c) => {
  return c.json(
    { error: "not_found", message: "There is no public Gemini proxy. See docs/SECURITY.md." },
    404,
  );
});

app.notFound((c) => c.json({ error: "not_found" }, 404));

export default app;

function isBypass(value: string): boolean {
  return value === "1";
}
