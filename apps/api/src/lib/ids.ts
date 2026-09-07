const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function nowIso(): string {
  return new Date().toISOString();
}

export function ulid(now = Date.now()): string {
  const timeChars: string[] = [];
  let t = now;
  for (let i = 0; i < 10; i += 1) {
    timeChars.push(CROCKFORD[t % 32]!);
    t = Math.floor(t / 32);
  }

  const rand = new Uint8Array(10);
  crypto.getRandomValues(rand);
  let buffer = 0n;
  let bits = 0;
  for (const byte of rand) {
    buffer = (buffer << 8n) | BigInt(byte);
    bits += 8;
  }

  let randChars = "";
  for (let i = 0; i < 16; i += 1) {
    bits -= 5;
    const index = Number((buffer >> BigInt(bits)) & 31n);
    randChars += CROCKFORD[index]!;
  }

  return timeChars.reverse().join("") + randChars;
}

export function hex(bytes: Uint8Array): string {
  let out = "";
  for (const byte of bytes) {
    out += byte.toString(16).padStart(2, "0");
  }
  return out;
}

export function randomUrlSafe(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

export function base64Url(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function sha256Bytes(data: BufferSource): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(digest);
}

export async function sha256Hex(data: BufferSource | string): Promise<string> {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  return hex(await sha256Bytes(bytes));
}

export async function hmacSha256(secret: string, payload: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return new Uint8Array(sig);
}

export async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  return hex(await hmacSha256(secret, payload));
}

export async function pkceChallenge(verifier: string): Promise<string> {
  return base64Url(await sha256Bytes(new TextEncoder().encode(verifier)));
}

export function timingSafeEqual(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  const max = Math.max(left.length, right.length);
  let diff = left.length ^ right.length;
  for (let i = 0; i < max; i += 1) {
    diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }
  return diff === 0;
}
