import type { Context, Next } from "hono";

/** Session stub: production reads the hashed cookie against D1. */
export async function requireSession(c: Context, next: Next) {
  const cookie = c.req.header("Cookie") ?? "";
  const match = cookie.match(/(?:__Host-)?szr_session=([^;]+)/);
  const header = c.req.header("Authorization")?.replace(/^Bearer\s+/i, "");
  const token = match?.[1] ?? header;
  if (!token) {
    return c.json(
      {
        error: "unauthenticated",
        message: "Sign in with Google before an AI fix, upload, or checkout.",
      },
      401,
    );
  }
  c.set("userId", "stub-user");
  c.set("sessionToken", token);
  await next();
}
