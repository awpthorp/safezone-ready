import type { Context } from "hono";
import { setCookie } from "hono/cookie";
import type { ApiEnv, ApiVariables } from "../env";
import { isLocal } from "../env";
import { hmacSha256Hex, nowIso, randomUrlSafe, sha256Hex } from "./ids";

const SESSION_MAX_AGE_S = 14 * 24 * 60 * 60;

type AppContext = Context<{ Bindings: ApiEnv; Variables: ApiVariables }>;

export function sessionCookieName(env: ApiEnv): string {
  return isLocal(env) ? "szr_session" : "__Host-szr_session";
}

export function applySessionCookie(c: AppContext, rawToken: string): void {
  setCookie(c, sessionCookieName(c.env), rawToken, {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    secure: !isLocal(c.env),
    maxAge: SESSION_MAX_AGE_S,
  });
}

export async function createSession(env: ApiEnv, userId: string, request: Request): Promise<string> {
  const raw = randomUrlSafe(32);
  const id = await sha256Hex(raw);
  const now = Date.now();
  const created = new Date(now).toISOString();
  const expires = new Date(now + SESSION_MAX_AGE_S * 1000).toISOString();
  const ip = request.headers.get("CF-Connecting-IP") ?? "";
  const ua = request.headers.get("User-Agent") ?? "";
  const ipHash = env.IP_HASH_SECRET ? await hmacSha256Hex(env.IP_HASH_SECRET, ip) : null;
  const uaHash = env.IP_HASH_SECRET ? await hmacSha256Hex(env.IP_HASH_SECRET, ua) : await sha256Hex(ua);
  await env.DB.prepare(
    `INSERT INTO sessions (id, user_id, created_at, expires_at, ip_hash, user_agent_hash)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, userId, created, expires, ipHash, uaHash)
    .run();
  return raw;
}

export async function lookupSession(
  env: ApiEnv,
  rawToken: string,
): Promise<{ userId: string; bannedAt: string | null; emailVerified: number } | null> {
  const id = await sha256Hex(rawToken);
  const row = await env.DB.prepare(
    `SELECT s.user_id AS userId, u.banned_at AS bannedAt, u.email_verified AS emailVerified
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = ? AND s.expires_at > ?`,
  )
    .bind(id, nowIso())
    .first<{ userId: string; bannedAt: string | null; emailVerified: number }>();
  return row ?? null;
}
