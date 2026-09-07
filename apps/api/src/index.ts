import { Hono } from "hono";
import type { ApiEnv, ApiVariables } from "./env";
import { fixesEnabled, isLocal } from "./env";
import { corsGuard } from "./middleware/cors";
import { rateLimit } from "./middleware/rateLimit";
import { requireTurnstile } from "./middleware/turnstile";
import { requireSession } from "./middleware/authz";
import {
  countInflightJobs,
  countJobsSince,
  creditBalance,
  debitFixIfFunds,
  ensureLocalStubUser,
  insertLedger,
  refundJob,
} from "./lib/credits";
import { nowIso, randomUrlSafe, sha256Hex, ulid } from "./lib/ids";
import {
  ALLOWED_IMAGE_MIMES,
  MAX_UPLOAD_BYTES,
  sniffImage,
  validateImageDimensions,
  type AllowedImageMime,
} from "./lib/magicBytes";
import {
  consumeOauthState,
  exchangeGoogleCode,
  safeReturnPath,
  startGoogleOauth,
  upsertGoogleUser,
} from "./lib/oauth";
import { applySessionCookie, createSession } from "./lib/sessions";
import { assetKey, assertAllowedR2Key } from "./lib/r2Keys";
import {
  creditsForSku,
  integrationIdentifier,
  isPackSku,
  payloadSha256,
  priceIdForSku,
  stripeFormPost,
  StripeHttpError,
  verifyStripeSignature,
} from "./lib/stripe";

interface FixJobMessage {
  jobId: string;
  userId: string;
  assetId: string;
  r2Key: string;
  mime: AllowedImageMime;
  placementIds: string[];
  mustKeepText: string[];
  width?: number;
  height?: number;
}

const app = new Hono<{ Bindings: ApiEnv; Variables: ApiVariables }>();

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

app.get("/api/me", requireSession, rateLimit({ limit: 60, windowMs: 60_000, key: "user" }), async (c) => {
  const credits = await creditBalance(c.env.DB, c.get("userId"));
  return c.json({ credits, signedIn: true as const });
});

app.get("/api/auth/google", rateLimit({ limit: 10, windowMs: 15 * 60_000, key: "ip" }), async (c) => {
  if (isLocal(c.env) && !c.env.GOOGLE_CLIENT_ID) {
    await ensureLocalStubUser(c.env.DB);
    applySessionCookie(c, randomUrlSafe(16));
    return c.redirect(`${c.env.APP_ORIGIN}/`, 302);
  }
  if (!c.env.GOOGLE_CLIENT_ID || !c.env.GOOGLE_CLIENT_SECRET) {
    return c.json(
      {
        error: "oauth_not_configured",
        message: "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
        next: "See README.md and docs/SPEC.md §10.",
      },
      501,
    );
  }
  const { url } = await startGoogleOauth(c.env, safeReturnPath(c.req.query("next")));
  return c.redirect(url, 302);
});

app.get("/api/auth/callback", rateLimit({ limit: 20, windowMs: 15 * 60_000, key: "ip" }), async (c) => {
  const err = c.req.query("error");
  if (err) {
    return c.redirect(`${c.env.APP_ORIGIN}/?auth=error`, 302);
  }
  const code = c.req.query("code");
  const state = c.req.query("state");
  if (!code || !state) {
    return c.redirect(`${c.env.APP_ORIGIN}/?auth=error`, 302);
  }
  try {
    const stored = await consumeOauthState(c.env, state);
    if (!stored) {
      return c.redirect(`${c.env.APP_ORIGIN}/?auth=error`, 302);
    }
    const profile = await exchangeGoogleCode(c.env, code, stored.verifier);
    if (!profile.emailVerified) {
      return c.redirect(`${c.env.APP_ORIGIN}/?auth=error`, 302);
    }
    const userId = await upsertGoogleUser(c.env.DB, profile);
    const raw = await createSession(c.env, userId, c.req.raw);
    applySessionCookie(c, raw);
    const next = safeReturnPath(stored.returnPath);
    return c.redirect(`${c.env.APP_ORIGIN}${next === "/" ? "/" : next}`, 302);
  } catch {
    return c.redirect(`${c.env.APP_ORIGIN}/?auth=error`, 302);
  }
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
    const userId = c.get("userId");
    const parsed = await readUploadBytes(c);
    if ("error" in parsed) {
      return c.json({ error: parsed.error, message: parsed.message }, parsed.status);
    }
    const sniffed = sniffImage(parsed.bytes);
    if (!sniffed) {
      return c.json(
        { error: "invalid_image", message: "Use a PNG, JPEG, or WebP still. Magic bytes did not match." },
        400,
      );
    }
    if (sniffed.mime !== parsed.mime) {
      return c.json(
        { error: "mime_mismatch", message: "The file type header did not match the image bytes." },
        400,
      );
    }
    const sizeError = validateImageDimensions(sniffed.width, sniffed.height);
    if (sizeError) {
      return c.json({ error: "invalid_dimensions", message: sizeError }, 400);
    }

    const assetId = ulid();
    const key = assetKey(userId, assetId, sniffed.ext);
    const digest = await sha256Hex(parsed.bytes);
    const ttlHours = Math.min(72, Math.max(1, Number(c.env.ASSET_TTL_HOURS) || 24));
    const created = nowIso();
    const expires = new Date(Date.now() + ttlHours * 3600 * 1000).toISOString();

    await c.env.ASSETS.put(key, parsed.bytes, {
      httpMetadata: { contentType: sniffed.mime },
      customMetadata: { sha256: digest, userId },
    });

    try {
      await c.env.DB.prepare(
        `INSERT INTO assets (id, user_id, r2_key, sha256, mime, bytes, width, height, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          assetId,
          userId,
          key,
          digest,
          sniffed.mime,
          parsed.bytes.byteLength,
          sniffed.width,
          sniffed.height,
          expires,
          created,
        )
        .run();
    } catch (error) {
      await c.env.ASSETS.delete(key);
      throw error;
    }

    return c.json({ assetId });
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
    const userId = c.get("userId");
    const idempotency = c.req.header("Idempotency-Key") || ulid();
    let body: Record<string, unknown> = {};
    try {
      body = await c.req.json();
    } catch {
      body = {};
    }
    const assetId = stringField(body.assetId ?? body.asset_id);
    if (!assetId) {
      return c.json({ error: "asset_required", message: "Upload a still before requesting a fix." }, 400);
    }

    const existing = await c.env.DB.prepare(
      "SELECT id, status FROM jobs WHERE user_id = ? AND idempotency_key = ?",
    )
      .bind(userId, idempotency)
      .first<{ id: string; status: string }>();
    if (existing) {
      return c.json({ jobId: existing.id, status: existing.status, idempotencyKey: idempotency });
    }

    const asset = await c.env.DB.prepare(
      "SELECT id, r2_key AS r2Key, mime, width, height FROM assets WHERE id = ? AND user_id = ?",
    )
      .bind(assetId, userId)
      .first<{ id: string; r2Key: string; mime: string; width: number; height: number }>();
    if (!asset) {
      return c.json({ error: "asset_not_found", message: "That upload was not found." }, 404);
    }

    const userInflight = await countInflightJobs(c.env.DB, userId);
    if (userInflight >= 2) {
      return c.json({ error: "too_many_jobs", message: "Wait for an open edit to finish." }, 429);
    }
    const globalCap = Number(c.env.GLOBAL_FIX_CONCURRENCY) || 20;
    const globalInflight = await countInflightJobs(c.env.DB);
    if (globalInflight >= globalCap) {
      return c.json(
        { error: "fixes_paused", message: "AI edits are busy. Try again in a minute." },
        503,
      );
    }
    const dailyCap = Number(c.env.DAILY_GEMINI_CAP) || 200;
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const daily = await countJobsSince(c.env.DB, dayStart.toISOString());
    if (daily >= dailyCap) {
      return c.json(
        { error: "fixes_paused", message: "The daily edit cap has been reached. Try again tomorrow." },
        503,
      );
    }

    const placementIds = stringArray(body.placementIds ?? body.placement_ids, ["combined"]);
    const mustKeepText = stringArray(body.mustKeepText ?? body.must_keep_text, []);
    const jobId = ulid();
    const created = nowIso();
    const debited = await debitFixIfFunds(c.env.DB, userId, jobId);
    if (!debited) {
      return c.json(
        {
          error: "insufficient_credits",
          message: "You have used your complimentary edits. Buy a pack to keep going.",
        },
        402,
      );
    }

    try {
      await c.env.DB.prepare(
        `INSERT INTO jobs (
           id, user_id, asset_id, status, placement_ids_json, must_keep_text_json,
           model_primary, idempotency_key, attempts, created_at
         ) VALUES (?, ?, ?, 'queued', ?, ?, ?, ?, 0, ?)`,
      )
        .bind(
          jobId,
          userId,
          asset.id,
          JSON.stringify(placementIds),
          JSON.stringify(mustKeepText),
          c.env.GEMINI_MODEL_PRIMARY,
          idempotency,
          created,
        )
        .run();
    } catch (error) {
      await refundJob(c.env.DB, userId, jobId);
      throw error;
    }

    const message: FixJobMessage = {
      jobId,
      userId,
      assetId: asset.id,
      r2Key: assertAllowedR2Key(asset.r2Key),
      mime: asset.mime as AllowedImageMime,
      placementIds,
      mustKeepText,
      width: asset.width,
      height: asset.height,
    };

    try {
      await c.env.FIX_QUEUE.send(message);
    } catch {
      await refundJob(c.env.DB, userId, jobId);
      await c.env.DB.prepare(
        "UPDATE jobs SET status = 'failed', failure_code = 'timeout', finished_at = ? WHERE id = ?",
      )
        .bind(nowIso(), jobId)
        .run();
      return c.json(
        { error: "queue_unavailable", message: "We could not queue that edit. The credit was returned." },
        503,
      );
    }

    console.log(JSON.stringify({ event: "fix.enqueued", jobId, userId }));
    return c.json({
      jobId,
      status: "queued",
      idempotencyKey: idempotency,
    });
  },
);

app.get("/api/jobs/:id/output", requireSession, rateLimit({ limit: 60, windowMs: 60_000, key: "user" }), async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const job = await c.env.DB.prepare(
    "SELECT id, user_id AS userId, status, output_r2_key AS outputR2Key FROM jobs WHERE id = ?",
  )
    .bind(id)
    .first<{ id: string; userId: string; status: string; outputR2Key: string | null }>();
  if (!job || job.userId !== userId) {
    return c.json({ error: "not_found" }, 404);
  }
  if (job.status !== "succeeded" || !job.outputR2Key) {
    return c.json({ error: "not_ready", message: "That edit is not ready to download." }, 404);
  }
  const key = assertAllowedR2Key(job.outputR2Key);
  const object = await c.env.ASSETS.get(key);
  if (!object) {
    return c.json({ error: "not_found" }, 404);
  }
  const bytes = await object.arrayBuffer();
  c.header("Content-Type", object.httpMetadata?.contentType || "image/png");
  c.header("Cache-Control", "private, no-store");
  return c.body(bytes);
});

app.get("/api/jobs/:id", requireSession, rateLimit({ limit: 60, windowMs: 60_000, key: "user" }), async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const job = await c.env.DB.prepare(
    `SELECT id, status, failure_code AS failureCode, output_r2_key AS outputR2Key, user_id AS userId
     FROM jobs WHERE id = ?`,
  )
    .bind(id)
    .first<{
      id: string;
      status: string;
      failureCode: string | null;
      outputR2Key: string | null;
      userId: string;
    }>();
  if (!job || job.userId !== userId) {
    return c.json({ error: "not_found" }, 404);
  }
  return c.json({
    id: job.id,
    status: job.status,
    failureCode: job.failureCode,
    outputReady: Boolean(job.outputR2Key) && job.status === "succeeded",
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
    let body: Record<string, unknown> = {};
    try {
      body = await c.req.json();
    } catch {
      body = {};
    }
    const sku = stringField(body.sku_id ?? body.skuId);
    if (!sku || !isPackSku(sku)) {
      return c.json({ error: "invalid_sku", message: "Choose pack_starter or pack_studio." }, 400);
    }
    const price = priceIdForSku(c.env, sku);
    if (!price) {
      return c.json(
        {
          error: "stripe_not_configured",
          message: "Stripe price IDs are not set for that pack.",
        },
        501,
      );
    }

    const userId = c.get("userId");
    const user = await c.env.DB.prepare(
      "SELECT email, stripe_customer_id AS stripeCustomerId FROM users WHERE id = ?",
    )
      .bind(userId)
      .first<{ email: string; stripeCustomerId: string | null }>();
    if (!user) {
      return c.json({ error: "unauthenticated", message: "Sign in with Google before checkout." }, 401);
    }

    let customerId = user.stripeCustomerId;
    try {
      if (!customerId) {
        const customer = await stripeFormPost<{ id: string }>(c.env, "/v1/customers", {
          email: user.email,
          "metadata[user_id]": userId,
        });
        customerId = customer.id;
        await c.env.DB.prepare("UPDATE users SET stripe_customer_id = ?, updated_at = ? WHERE id = ?")
          .bind(customerId, nowIso(), userId)
          .run();
      }
      const session = await stripeFormPost<{ id: string; url?: string }>(c.env, "/v1/checkout/sessions", {
        mode: "payment",
        customer: customerId,
        success_url: `${c.env.APP_ORIGIN}/?checkout=success`,
        cancel_url: `${c.env.APP_ORIGIN}/?checkout=cancel`,
        "line_items[0][price]": price,
        "line_items[0][quantity]": "1",
        client_reference_id: userId,
        "metadata[user_id]": userId,
        "metadata[sku_code]": sku,
        integration_identifier: integrationIdentifier(),
      });
      if (!session.url) {
        return c.json({ error: "stripe_failed", message: "Stripe did not return a checkout URL." }, 502);
      }
      return c.json({ url: session.url, id: session.id });
    } catch (error) {
      const message = error instanceof StripeHttpError ? error.message : "Stripe request failed.";
      return c.json({ error: "stripe_failed", message }, 502);
    }
  },
);

app.post(
  "/api/billing/portal",
  requireSession,
  rateLimit({ limit: 8, windowMs: 60 * 60_000, key: "user" }),
  async (c) => {
    if (!c.env.STRIPE_SECRET_KEY) {
      return c.json(
        {
          error: "stripe_not_configured",
          message: "Stripe is not configured. Use test mode keys in .dev.vars.",
        },
        501,
      );
    }
    const userId = c.get("userId");
    const user = await c.env.DB.prepare("SELECT stripe_customer_id AS stripeCustomerId FROM users WHERE id = ?")
      .bind(userId)
      .first<{ stripeCustomerId: string | null }>();
    if (!user?.stripeCustomerId) {
      return c.json({ error: "no_customer", message: "Buy a pack first, then manage billing." }, 400);
    }
    try {
      const session = await stripeFormPost<{ url?: string }>(c.env, "/v1/billing_portal/sessions", {
        customer: user.stripeCustomerId,
        return_url: c.env.APP_ORIGIN,
      });
      if (!session.url) {
        return c.json({ error: "stripe_failed", message: "Stripe did not return a portal URL." }, 502);
      }
      return c.json({ url: session.url });
    } catch (error) {
      const message = error instanceof StripeHttpError ? error.message : "Stripe request failed.";
      return c.json({ error: "stripe_failed", message }, 502);
    }
  },
);

app.post("/api/webhooks/stripe", async (c) => {
  const signature = c.req.header("stripe-signature") ?? c.req.header("Stripe-Signature");
  if (!c.env.STRIPE_WEBHOOK_SECRET || !signature) {
    return c.json(
      {
        error: "webhook_unverified",
        message: "Stripe webhook signature required. Never grant credits from the browser.",
      },
      400,
    );
  }
  const rawBody = await c.req.text();
  const ok = await verifyStripeSignature(rawBody, signature, c.env.STRIPE_WEBHOOK_SECRET);
  if (!ok) {
    return c.json(
      {
        error: "webhook_unverified",
        message: "Stripe webhook signature required. Never grant credits from the browser.",
      },
      400,
    );
  }

  let event: {
    id?: string;
    type?: string;
    data?: { object?: Record<string, unknown> };
  };
  try {
    event = JSON.parse(rawBody) as typeof event;
  } catch {
    return c.json({ error: "invalid_json", message: "Webhook body was not JSON." }, 400);
  }
  if (!event.id || !event.type) {
    return c.json({ error: "invalid_event", message: "Webhook event was missing an id." }, 400);
  }

  const digest = await payloadSha256(rawBody);
  const processedAt = nowIso();

  if (event.type === "checkout.session.completed") {
    const session = event.data?.object ?? {};
    const metadata = (session.metadata ?? {}) as Record<string, unknown>;
    const userId = stringField(metadata.user_id) || stringField(session.client_reference_id);
    const sku = stringField(metadata.sku_code);
    if (userId && sku && isPackSku(sku)) {
      try {
        await insertLedger(c.env.DB, {
          userId,
          delta: creditsForSku(c.env, sku),
          reason: "stripe_pack",
          stripeEventId: event.id,
          skuCode: sku,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!/unique|constraint/i.test(message)) {
          throw error;
        }
      }
    }
  }

  try {
    await c.env.DB.prepare(
      "INSERT INTO stripe_events (id, type, processed_at, payload_sha256) VALUES (?, ?, ?, ?)",
    )
      .bind(event.id, event.type, processedAt, digest)
      .run();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/unique|constraint/i.test(message)) {
      return c.json({ ok: true, deduped: true });
    }
    throw error;
  }

  return c.json({ ok: true });
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

function stringField(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function stringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) {
    return fallback;
  }
  const items = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  return items.length ? items : fallback;
}

async function readUploadBytes(c: {
  req: {
    header: (name: string) => string | undefined;
    arrayBuffer: () => Promise<ArrayBuffer>;
    parseBody?: () => Promise<Record<string, unknown>>;
    raw: Request;
  };
}): Promise<
  | { bytes: Uint8Array; mime: AllowedImageMime }
  | { error: string; message: string; status: 400 | 413 }
> {
  const declaredLength = Number(c.req.header("Content-Length") ?? "0");
  if (declaredLength > MAX_UPLOAD_BYTES) {
    return {
      error: "too_large",
      message: "Stills must be 20 MB or smaller.",
      status: 413,
    };
  }
  const contentType = (c.req.header("Content-Type") ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
  if (contentType.startsWith("multipart/form-data")) {
    const form = await c.req.raw.formData();
    const file = firstFile(form);
    if (!file) {
      return {
        error: "file_required",
        message: "Attach a PNG, JPEG, or WebP file.",
        status: 400,
      };
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return {
        error: "too_large",
        message: "Stills must be 20 MB or smaller.",
        status: 413,
      };
    }
    const mime = (file.type || "").split(";")[0]?.trim().toLowerCase();
    if (!mime || !isAllowedMime(mime)) {
      return {
        error: "invalid_type",
        message: "Use a PNG, JPEG, or WebP still.",
        status: 400,
      };
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    return { bytes, mime };
  }
  if (!isAllowedMime(contentType)) {
    return {
      error: "invalid_type",
      message: "Use a PNG, JPEG, or WebP still.",
      status: 400,
    };
  }
  const bytes = new Uint8Array(await c.req.arrayBuffer());
  if (bytes.byteLength > MAX_UPLOAD_BYTES) {
    return {
      error: "too_large",
      message: "Stills must be 20 MB or smaller.",
      status: 413,
    };
  }
  if (bytes.byteLength < 24) {
    return {
      error: "invalid_image",
      message: "That file is too small to be a still.",
      status: 400,
    };
  }
  return { bytes, mime: contentType };
}

function isAllowedMime(value: string): value is AllowedImageMime {
  return (ALLOWED_IMAGE_MIMES as readonly string[]).includes(value);
}

function firstFile(form: FormData): File | null {
  for (const key of ["file", "image", "asset", "still"]) {
    const value = form.get(key);
    if (value instanceof File) {
      return value;
    }
  }
  for (const value of form.values()) {
    if (value instanceof File) {
      return value;
    }
  }
  return null;
}
