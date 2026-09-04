import type { Context, Next } from "hono";

export interface RateLimitRule {
  limit: number;
  windowMs: number;
  key: "ip" | "user";
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function rateLimit(rule: RateLimitRule) {
  return async (c: Context, next: Next) => {
    const now = Date.now();
    const id =
      rule.key === "user"
        ? (c.get("userId") as string | undefined) ?? ipKey(c)
        : ipKey(c);
    const bucketKey = `${c.req.path}:${rule.key}:${id}`;
    const current = buckets.get(bucketKey);
    if (!current || current.resetAt <= now) {
      buckets.set(bucketKey, { count: 1, resetAt: now + rule.windowMs });
      await next();
      return;
    }
    if (current.count >= rule.limit) {
      const retry = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
      c.header("Retry-After", String(retry));
      return c.json(
        { error: "rate_limited", message: "Too many requests. Please wait and try again." },
        429,
      );
    }
    current.count += 1;
    await next();
  };
}

function ipKey(c: Context): string {
  return c.req.header("CF-Connecting-IP") ?? c.req.header("X-Forwarded-For") ?? "local";
}

/**
 * Production should also attach Cloudflare Rate Limiting rules on
 * /api/fix, /api/uploads, and /api/auth/* (see docs/SPEC.md §14.2).
 * This in-isolate map is a development hook and a single-isolate backstop.
 */
