import type { ApiEnv } from "../env";
import { grantWelcomeOnce } from "./credits";
import { nowIso, pkceChallenge, randomUrlSafe, ulid } from "./ids";

export interface GoogleProfile {
  sub: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
}

export async function startGoogleOauth(
  env: ApiEnv,
  returnPath: string,
): Promise<{ url: string }> {
  const state = randomUrlSafe(24);
  const verifier = randomUrlSafe(32);
  const challenge = await pkceChallenge(verifier);
  const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  await env.DB.prepare(
    `INSERT INTO oauth_states (state, pkce_verifier, return_path, expires_at)
     VALUES (?, ?, ?, ?)`,
  )
    .bind(state, verifier, returnPath, expires)
    .run();

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", env.GOOGLE_CLIENT_ID ?? "");
  url.searchParams.set("redirect_uri", `${env.API_PUBLIC_URL}/api/auth/callback`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("prompt", "select_account");
  return { url: url.toString() };
}

export async function consumeOauthState(
  env: ApiEnv,
  state: string,
): Promise<{ verifier: string; returnPath: string } | null> {
  const row = await env.DB.prepare(
    "SELECT pkce_verifier AS verifier, return_path AS returnPath, expires_at AS expiresAt FROM oauth_states WHERE state = ?",
  )
    .bind(state)
    .first<{ verifier: string; returnPath: string; expiresAt: string }>();
  await env.DB.prepare("DELETE FROM oauth_states WHERE state = ?").bind(state).run();
  if (!row) {
    return null;
  }
  if (row.expiresAt < nowIso()) {
    return null;
  }
  return { verifier: row.verifier, returnPath: row.returnPath };
}

export async function exchangeGoogleCode(
  env: ApiEnv,
  code: string,
  verifier: string,
): Promise<GoogleProfile> {
  const body = new URLSearchParams({
    code,
    client_id: env.GOOGLE_CLIENT_ID ?? "",
    client_secret: env.GOOGLE_CLIENT_SECRET ?? "",
    redirect_uri: `${env.API_PUBLIC_URL}/api/auth/callback`,
    grant_type: "authorization_code",
    code_verifier: verifier,
  });
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!tokenRes.ok) {
    throw new Error("token_exchange_failed");
  }
  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  if (!tokenJson.access_token) {
    throw new Error("token_exchange_failed");
  }
  const userRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  if (!userRes.ok) {
    throw new Error("userinfo_failed");
  }
  const profile = (await userRes.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  };
  if (!profile.sub || !profile.email) {
    throw new Error("userinfo_incomplete");
  }
  return {
    sub: profile.sub,
    email: profile.email,
    emailVerified: Boolean(profile.email_verified),
    name: profile.name,
    picture: profile.picture,
  };
}

export async function upsertGoogleUser(db: D1Database, profile: GoogleProfile): Promise<string> {
  const existing = await db
    .prepare("SELECT id FROM users WHERE google_sub = ?")
    .bind(profile.sub)
    .first<{ id: string }>();
  const now = nowIso();
  if (existing) {
    await db
      .prepare(
        `UPDATE users
         SET email = ?, email_verified = ?, display_name = ?, avatar_url = ?, updated_at = ?
         WHERE id = ?`,
      )
      .bind(
        profile.email,
        profile.emailVerified ? 1 : 0,
        profile.name ?? null,
        profile.picture ?? null,
        now,
        existing.id,
      )
      .run();
    await grantWelcomeOnce(db, existing.id);
    return existing.id;
  }
  const id = ulid();
  await db
    .prepare(
      `INSERT INTO users (
         id, google_sub, email, email_verified, display_name, avatar_url, role, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, 'user', ?, ?)`,
    )
    .bind(
      id,
      profile.sub,
      profile.email,
      profile.emailVerified ? 1 : 0,
      profile.name ?? null,
      profile.picture ?? null,
      now,
      now,
    )
    .run();
  await grantWelcomeOnce(db, id);
  return id;
}

export function safeReturnPath(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return "/";
  }
  return value;
}
