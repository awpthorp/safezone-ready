export interface ApiEnv {
  ENVIRONMENT: string;
  APP_ORIGIN: string;
  API_PUBLIC_URL: string;
  FIXES_ENABLED: string;
  TURNSTILE_BYPASS: string;
  GEMINI_MODEL_PRIMARY: string;
  GEMINI_MODEL_ESCALATION: string;
  DAILY_GEMINI_CAP: string;
  BURN_ALERT_USD: string;
  GLOBAL_FIX_CONCURRENCY: string;
  ASSET_TTL_HOURS: string;
  ALLOW_UNVERIFIED_DOWNLOAD: string;
  STRIPE_STARTER_CREDITS: string;
  STRIPE_STUDIO_CREDITS: string;
  GEMINI_API_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRICE_STARTER?: string;
  STRIPE_PRICE_STUDIO?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  TURNSTILE_SECRET_KEY?: string;
  SESSION_SECRET?: string;
  IP_HASH_SECRET?: string;
  DB: D1Database;
  ASSETS: R2Bucket;
  FIX_QUEUE: Queue;
}

export interface ApiVariables {
  userId: string;
  sessionToken: string;
}

export function isLocal(env: ApiEnv): boolean {
  return env.ENVIRONMENT === "local";
}

export function fixesEnabled(env: ApiEnv): boolean {
  return env.FIXES_ENABLED !== "false";
}
