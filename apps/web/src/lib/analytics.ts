const DATAFAST_WEBSITE_ID = "dfid_YmcRcHzFPY2hogFvefTFA";
const DATAFAST_DOMAIN = "safezoneready.com";

type DataFastFn = ((...args: unknown[]) => void) & { q?: unknown[] };

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    datafast?: DataFastFn;
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

function isMothershipHost(): boolean {
  const host = window.location.hostname;
  return host === "safezoneready.com" || host === "www.safezoneready.com";
}

function startDataFast(): void {
  if (!isMothershipHost() || document.getElementById("datafast-script")) {
    return;
  }
  if (!window.datafast) {
    const queued: DataFastFn = function datafast() {
      queued.q = queued.q ?? [];
      queued.q.push(arguments);
    };
    window.datafast = queued;
  }

  const script = document.createElement("script");
  script.id = "datafast-script";
  script.defer = true;
  script.src = "https://datafa.st/js/script.js";
  script.setAttribute("data-website-id", DATAFAST_WEBSITE_ID);
  script.setAttribute("data-domain", DATAFAST_DOMAIN);
  document.head.appendChild(script);
}

export function startAnalytics(): void {
  if (started || typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  started = true;
  startDataFast();

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
