/** Browser origins allowed to call the API. Satellite hosts are redirect-only and must not appear here. */
export const FIXED_APP_ORIGINS = [
  "https://safezoneready.com",
  "https://www.safezoneready.com",
  "https://staging.safezoneready.com",
  "https://safezone-ready-web.pages.dev",
  "https://staging.safezone-ready-web.pages.dev",
  "http://127.0.0.1:43173",
  "http://localhost:43173",
] as const;

export function allowedOrigins(appOrigin: string): string[] {
  const extra = appOrigin && !FIXED_APP_ORIGINS.includes(appOrigin as (typeof FIXED_APP_ORIGINS)[number])
    ? [appOrigin]
    : [];
  return [...FIXED_APP_ORIGINS, ...extra];
}
