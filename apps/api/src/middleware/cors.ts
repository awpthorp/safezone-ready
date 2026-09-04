import type { Context, Next } from "hono";
import type { ApiEnv } from "../env";
import { allowedOrigins } from "../origins";

export async function corsGuard(c: Context<{ Bindings: ApiEnv }>, next: Next) {
  const origin = c.req.header("Origin");
  const allowlist = allowedOrigins(c.env.APP_ORIGIN);
  const allow = origin && allowlist.includes(origin) ? origin : allowlist[0];
  if (c.req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(allow),
    });
  }
  await next();
  c.header("Access-Control-Allow-Origin", allow);
  c.header("Access-Control-Allow-Credentials", "true");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Idempotency-Key, X-Turnstile-Token");
  c.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  c.header("Vary", "Origin");
}

function corsHeaders(origin: string): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Idempotency-Key, X-Turnstile-Token",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    Vary: "Origin",
  };
}
