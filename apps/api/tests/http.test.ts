import { describe, expect, it } from "vitest";
import app from "../src/index";

function testEnv(over: Record<string, unknown> = {}) {
  return {
    ENVIRONMENT: "local",
    APP_ORIGIN: "http://127.0.0.1:43173",
    API_PUBLIC_URL: "http://127.0.0.1:8787",
    FIXES_ENABLED: "true",
    TURNSTILE_BYPASS: "1",
    GEMINI_MODEL_PRIMARY: "primary-model",
    GEMINI_MODEL_ESCALATION: "escalation-model",
    DAILY_GEMINI_CAP: "200",
    BURN_ALERT_USD: "50",
    GLOBAL_FIX_CONCURRENCY: "20",
    ASSET_TTL_HOURS: "24",
    ALLOW_UNVERIFIED_DOWNLOAD: "false",
    STRIPE_STARTER_CREDITS: "20",
    STRIPE_STUDIO_CREDITS: "80",
    STRIPE_WEBHOOK_SECRET: "whsec_test",
    DB: {},
    ASSETS: {},
    FIX_QUEUE: {},
    ...over,
  };
}

describe("requireSession", () => {
  it("returns 401 without a cookie or bearer token", async () => {
    const res = await app.request("http://127.0.0.1/api/uploads", { method: "POST" }, testEnv());
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toBe("unauthenticated");
  });

  it("returns 401 on /api/me without a session", async () => {
    const res = await app.request("http://127.0.0.1/api/me", { method: "GET" }, testEnv());
    expect(res.status).toBe(401);
  });
});

describe("stripe webhook", () => {
  it("returns 400 when the request is unsigned", async () => {
    const res = await app.request(
      "http://127.0.0.1/api/webhooks/stripe",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "evt_test", type: "checkout.session.completed" }),
      },
      testEnv(),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toBe("webhook_unverified");
  });

  it("returns 400 when the webhook secret is missing", async () => {
    const res = await app.request(
      "http://127.0.0.1/api/webhooks/stripe",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Stripe-Signature": "t=1,v1=abc",
        },
        body: "{}",
      },
      testEnv({ STRIPE_WEBHOOK_SECRET: undefined }),
    );
    expect(res.status).toBe(400);
  });
});
