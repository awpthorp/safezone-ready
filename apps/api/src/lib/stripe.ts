import type { ApiEnv } from "../env";
import { hmacSha256Hex, sha256Hex, timingSafeEqual } from "./ids";

export const PACK_STARTER = "pack_starter";
export const PACK_STUDIO = "pack_studio";

export type PackSku = typeof PACK_STARTER | typeof PACK_STUDIO;

export function isPackSku(value: string): value is PackSku {
  return value === PACK_STARTER || value === PACK_STUDIO;
}

export function creditsForSku(env: ApiEnv, sku: PackSku): number {
  if (sku === PACK_STARTER) {
    return Number(env.STRIPE_STARTER_CREDITS) || 20;
  }
  return Number(env.STRIPE_STUDIO_CREDITS) || 80;
}

export function priceIdForSku(env: ApiEnv, sku: PackSku): string | undefined {
  return sku === PACK_STARTER ? env.STRIPE_PRICE_STARTER : env.STRIPE_PRICE_STUDIO;
}

export async function verifyStripeSignature(
  rawBody: string,
  header: string | undefined,
  secret: string,
  nowMs = Date.now(),
): Promise<boolean> {
  if (!header) {
    return false;
  }
  const parts = header.split(",").map((item) => item.trim());
  let timestamp = "";
  const signatures: string[] = [];
  for (const part of parts) {
    const [key, ...rest] = part.split("=");
    const value = rest.join("=");
    if (key === "t") {
      timestamp = value;
    }
    if (key === "v1") {
      signatures.push(value);
    }
  }
  if (!timestamp || signatures.length === 0) {
    return false;
  }
  const ageMs = Math.abs(nowMs - Number(timestamp) * 1000);
  if (!Number.isFinite(ageMs) || ageMs > 5 * 60 * 1000) {
    return false;
  }
  const expected = await hmacSha256Hex(secret, `${timestamp}.${rawBody}`);
  return signatures.some((signature) => timingSafeEqual(signature, expected));
}

export async function stripeFormPost<T>(
  env: ApiEnv,
  path: string,
  params: Record<string, string | undefined>,
): Promise<T> {
  const secret = env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error("stripe_not_configured");
  }
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      body.set(key, value);
    }
  }
  const res = await fetch(`https://api.stripe.com${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const json = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) {
    const message = json.error?.message || "Stripe request failed.";
    throw new StripeHttpError(res.status, message);
  }
  return json;
}

export class StripeHttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "StripeHttpError";
  }
}

export async function payloadSha256(rawBody: string): Promise<string> {
  return sha256Hex(rawBody);
}

export function integrationIdentifier(): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let out = "szr_pack_";
  for (const byte of bytes) {
    out += alphabet[byte % alphabet.length]!;
  }
  return out;
}
