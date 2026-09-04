import type { Context, Next } from "hono";
import type { ApiEnv } from "../env";

function allowedOrigins(env: ApiEnv): string[] {
  return [
    env.APP_ORIGIN,
    "http://127.0.0.1:43173",
    "http://localhost:43173",
  ].filter(Boolean);
}

export async function corsGuard(c: Context<{ Bindings: ApiEnv }>, next: Next) {
  const origin = c.req.header("Origin");
  const allow = origin && allowedOrigins(c.env).includes(origin) ? origin : allowedOrigins(c.env)[0];
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
