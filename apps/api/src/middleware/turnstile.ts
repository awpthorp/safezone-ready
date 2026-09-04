import type { Context, Next } from "hono";
import type { ApiEnv } from "../env";
import { isLocal } from "../env";

export async function requireTurnstile(c: Context<{ Bindings: ApiEnv }>, next: Next) {
  if (isLocal(c.env) && c.env.TURNSTILE_BYPASS === "1") {
    await next();
    return;
  }

  const token = c.req.header("X-Turnstile-Token") ?? "";

  if (!token || !c.env.TURNSTILE_SECRET_KEY) {
    return c.json(
      {
        error: "turnstile_required",
        message: "Complete the Turnstile check and try again.",
      },
      403,
    );
  }

  const body = new FormData();
  body.append("secret", c.env.TURNSTILE_SECRET_KEY);
  body.append("response", token);
  const ip = c.req.header("CF-Connecting-IP");
  if (ip) {
    body.append("remoteip", ip);
  }

  const verify = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  const result = (await verify.json()) as { success?: boolean };
  if (!result.success) {
    return c.json(
      { error: "turnstile_failed", message: "We could not verify that request. Try again." },
      403,
    );
  }
  await next();
}
