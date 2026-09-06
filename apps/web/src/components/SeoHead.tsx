import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { pageView, startAnalytics, verificationContent } from "@/lib/analytics";
import { canonicalUrl, OG_IMAGE, OG_IMAGE_ALT, SITE_NAME, SITE_ORIGIN, type PageDef } from "@/seo/pages";
import { jsonLdForPage, organizationSchema, websiteSchema } from "@/seo/schema";

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function upsertJsonLd(json: unknown) {
  const id = "szr-jsonld";
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(json);
}

function hostShouldNoindex(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const host = window.location.hostname;
  return host.startsWith("staging.") || host.endsWith(".pages.dev") || host === "localhost" || host === "127.0.0.1";
}

export function SeoHead({ page, noindex = false }: { page: PageDef; noindex?: boolean }) {
  const location = useLocation();

  useEffect(() => {
    startAnalytics();
    const url =
      page.kind === "error" ? `${SITE_ORIGIN}${location.pathname}` : canonicalUrl(page.path);
    document.title = page.title;
    upsertMeta("name", "description", page.description);
    upsertLink("canonical", url);
    upsertMeta("property", "og:title", page.ogTitle);
    upsertMeta("property", "og:description", page.description);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:image", OG_IMAGE);
    upsertMeta("property", "og:image:width", "1200");
    upsertMeta("property", "og:image:height", "630");
    upsertMeta("property", "og:image:alt", OG_IMAGE_ALT);
    upsertMeta("property", "og:locale", "en_GB");
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", page.ogTitle);
    upsertMeta("name", "twitter:description", page.description);
    upsertMeta("name", "twitter:image", OG_IMAGE);
    const verify = verificationContent();
    if (verify) {
      upsertMeta("name", "google-site-verification", verify);
    }
    const hideFromIndex = noindex || page.kind === "error" || hostShouldNoindex();
    if (hideFromIndex) {
      upsertMeta("name", "robots", "noindex, nofollow");
    } else {
      document.head.querySelector('meta[name="robots"]')?.remove();
    }
    if (page.kind === "error") {
      upsertJsonLd({
        "@context": "https://schema.org",
        "@graph": [organizationSchema(), websiteSchema()],
      });
    } else {
      upsertJsonLd(jsonLdForPage(page));
    }
    pageView(location.pathname);
  }, [page, location.pathname, noindex]);

  return null;
}
