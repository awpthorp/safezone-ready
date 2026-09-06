declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let started = false;

function envValue(key: "VITE_GOOGLE_SITE_VERIFICATION" | "VITE_GA_MEASUREMENT_ID" | "VITE_CF_BEACON_TOKEN"): string {
  const raw = import.meta.env[key];
  return typeof raw === "string" ? raw.trim() : "";
}

export function verificationContent(): string {
  return envValue("VITE_GOOGLE_SITE_VERIFICATION");
}

export function gaMeasurementId(): string {
  return envValue("VITE_GA_MEASUREMENT_ID");
}

export function cfBeaconToken(): string {
  return envValue("VITE_CF_BEACON_TOKEN");
}

export function startAnalytics(): void {
  if (started || typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  started = true;

  const ga = gaMeasurementId();
  if (ga) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga)}`;
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer ?? [];
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
    window.gtag("js", new Date());
    window.gtag("config", ga, { send_page_view: false });
  }

  const beacon = cfBeaconToken();
  if (beacon) {
    const script = document.createElement("script");
    script.defer = true;
    script.src = "https://static.cloudflareinsights.com/beacon.min.js";
    script.setAttribute("data-cf-beacon", JSON.stringify({ token: beacon }));
    document.body.appendChild(script);
  }
}

export function pageView(path: string): void {
  const ga = gaMeasurementId();
  if (!ga || typeof window.gtag !== "function") {
    return;
  }
  window.gtag("event", "page_view", { page_path: path });
}
