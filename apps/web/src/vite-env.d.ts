/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_TURNSTILE_SITE_KEY: string;
  readonly VITE_POSTERLY_URL: string;
  readonly VITE_GOOGLE_SITE_VERIFICATION?: string;
  readonly VITE_GA_MEASUREMENT_ID?: string;
  readonly VITE_CF_BEACON_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
