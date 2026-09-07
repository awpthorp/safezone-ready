import type { Context, Next } from "hono";
import type { ApiEnv, ApiVariables } from "../env";
import { isLocal } from "../env";
import { ensureLocalStubUser } from "../lib/credits";
import { lookupSession } from "../lib/sessions";

type AppContext = Context<{ Bindings: ApiEnv; Variables: ApiVariables }>;

function readSessionToken(c: AppContext): string | undefined {
  const cookie = c.req.header("Cookie") ?? "";
  const match = cookie.match(/(?:__Host-)?szr_session=([^;]+)/);
  const header = c.req.header("Authorization")?.replace(/^Bearer\s+/i, "");
  const token = match?.[1] ?? header;
  return token || undefined;
}

/** Session gate: production reads the hashed cookie against D1. Local uses a stub user. */
export async function requireSession(c: AppContext, next: Next) {
  const token = readSessionToken(c);
  if (!token) {
    return c.json(
      {
        error: "unauthenticated",
        message: "Sign in with Google before an AI fix, upload, or checkout.",
      },
      401,
    );
  }

  if (isLocal(c.env)) {
    const userId = await ensureLocalStubUser(c.env.DB);
    c.set("userId", userId);
    c.set("sessionToken", token);
    await next();
    return;
  }

  const session = await lookupSession(c.env, token);
  if (!session) {
    return c.json(
      {
        error: "unauthenticated",
        message: "Sign in with Google before an AI fix, upload, or checkout.",
      },
      401,
    );
  }
  if (session.bannedAt) {
    return c.json({ error: "forbidden", message: "This account is disabled." }, 403);
  }
  if (!session.emailVerified) {
    return c.json(
      { error: "unverified_email", message: "Verify your Google email before using AI edits." },
      403,
    );
  }
  c.set("userId", session.userId);
  c.set("sessionToken", token);
  await next();
}
