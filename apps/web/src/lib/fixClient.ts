import { API_URL } from "./utils";

export type PackSku = "pack_starter" | "pack_studio";

export class ApiHttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiHttpError";
  }
}

export function googleAuthUrl(): string {
  return `${API_URL}/api/auth/google`;
}

export function uploadMime(blob: Blob, fileName: string): string {
  if (blob.type === "image/png" || blob.type === "image/jpeg" || blob.type === "image/webp") {
    return blob.type;
  }
  const name = fileName.toLowerCase();
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  if (name.endsWith(".webp")) {
    return "image/webp";
  }
  return "image/png";
}

function turnstileHeaders(): Record<string, string> {
  const token = readTurnstileToken();
  return token ? { "X-Turnstile-Token": token } : {};
}

function readTurnstileToken(): string | undefined {
  if (typeof document === "undefined") {
    return undefined;
  }
  const input = document.querySelector<HTMLInputElement>("[name=cf-turnstile-response]");
  if (input?.value) {
    return input.value;
  }
  const extra = window as unknown as { __szrTurnstileToken?: string };
  return extra.__szrTurnstileToken;
}

async function parseError(res: Response): Promise<ApiHttpError> {
  let code = "http_error";
  let message = `Request failed (${res.status})`;
  try {
    const body = (await res.json()) as { error?: string; message?: string };
    if (body.error) {
      code = body.error;
    }
    if (body.message) {
      message = body.message;
    }
  } catch {
    // keep the status fallback
  }
  return new ApiHttpError(res.status, code, message);
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  for (const [key, value] of Object.entries(turnstileHeaders())) {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  }
  try {
    return await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      credentials: "include",
    });
  } catch {
    throw new ApiHttpError(
      0,
      "api_unreachable",
      "Could not reach the API. Set VITE_API_URL or run the API worker.",
    );
  }
}

export async function getMe(): Promise<{ credits: number; signedIn: true } | null> {
  const res = await apiFetch("/api/me");
  if (res.status === 401) {
    return null;
  }
  if (!res.ok) {
    throw await parseError(res);
  }
  return res.json() as Promise<{ credits: number; signedIn: true }>;
}

export async function uploadStill(blob: Blob, mime: string): Promise<{ assetId: string }> {
  const res = await apiFetch("/api/uploads", {
    method: "POST",
    headers: { "Content-Type": mime },
    body: blob,
  });
  if (!res.ok) {
    throw await parseError(res);
  }
  const body = (await res.json()) as { assetId?: string };
  if (!body.assetId) {
    throw new ApiHttpError(500, "upload_failed", "Upload did not return an asset id.");
  }
  return { assetId: body.assetId };
}

export async function startFixJob(
  assetId: string,
  placementIds: string[],
): Promise<{ jobId: string; status: string }> {
  const res = await apiFetch("/api/fix", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({ assetId, placementIds }),
  });
  if (!res.ok) {
    throw await parseError(res);
  }
  const body = (await res.json()) as { jobId?: string; status?: string };
  if (!body.jobId) {
    throw new ApiHttpError(500, "fix_failed", "The API did not return a job id.");
  }
  return { jobId: body.jobId, status: body.status ?? "queued" };
}

export async function getJob(
  jobId: string,
): Promise<{ id: string; status: string; failureCode?: string | null }> {
  const res = await apiFetch(`/api/jobs/${encodeURIComponent(jobId)}`);
  if (!res.ok) {
    throw await parseError(res);
  }
  return res.json() as Promise<{ id: string; status: string; failureCode?: string | null }>;
}

export async function pollJob(
  jobId: string,
  timeoutMs = 180_000,
): Promise<{ id: string; status: string; failureCode?: string | null }> {
  const started = Date.now();
  for (;;) {
    const job = await getJob(jobId);
    if (job.status === "succeeded" || job.status === "failed" || job.status === "cancelled") {
      return job;
    }
    if (Date.now() - started > timeoutMs) {
      throw new ApiHttpError(408, "timeout", "That edit is taking too long. Try again in a minute.");
    }
    await new Promise((resolve) => {
      window.setTimeout(resolve, 1500);
    });
  }
}

export async function fetchJobOutput(jobId: string): Promise<Blob> {
  const res = await apiFetch(`/api/jobs/${encodeURIComponent(jobId)}/output`);
  if (!res.ok) {
    throw await parseError(res);
  }
  return res.blob();
}

export async function createCheckoutSession(skuId: PackSku): Promise<{ url: string }> {
  const res = await apiFetch("/api/checkout/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sku_id: skuId }),
  });
  if (!res.ok) {
    throw await parseError(res);
  }
  const body = (await res.json()) as { url?: string };
  if (!body.url) {
    throw new ApiHttpError(502, "stripe_failed", "Checkout did not return a URL.");
  }
  return { url: body.url };
}
