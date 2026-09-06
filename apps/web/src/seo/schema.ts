import { canonicalUrl, OG_IMAGE, SITE_NAME, SITE_ORIGIN, type PageDef } from "./pages";

export function organizationSchema() {
  return {
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_ORIGIN,
    logo: `${SITE_ORIGIN}/apple-touch-icon.png`,
  };
}

export function websiteSchema() {
  return {
    "@type": "WebSite",
    name: SITE_NAME,
    url: `${SITE_ORIGIN}/`,
    inLanguage: "en-GB",
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_ORIGIN },
  };
}

export function softwareApplicationSchema() {
  return {
    "@type": ["SoftwareApplication", "WebApplication"],
    name: SITE_NAME,
    url: `${SITE_ORIGIN}/`,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "GBP",
      description: "Local overlay check",
    },
  };
}

export function webPageSchema(page: PageDef) {
  return {
    "@type": "WebPage",
    name: page.h1,
    description: page.description,
    url: canonicalUrl(page.path),
    inLanguage: "en-GB",
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: `${SITE_ORIGIN}/` },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: OG_IMAGE,
      width: 1200,
      height: 630,
    },
  };
}

export function breadcrumbSchema(page: PageDef) {
  if (page.path === "/" || page.kind === "error") {
    return null;
  }
  return {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${SITE_ORIGIN}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: page.h1,
        item: canonicalUrl(page.path),
      },
    ],
  };
}

export function faqSchema(page: PageDef) {
  if (page.kind !== "home" || !page.faq?.length) {
    return null;
  }
  return {
    "@type": "FAQPage",
    mainEntity: page.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function jsonLdForPage(page: PageDef) {
  const graph: Record<string, unknown>[] = [
    organizationSchema(),
    websiteSchema(),
    softwareApplicationSchema(),
    webPageSchema(page),
  ];
  const crumbs = breadcrumbSchema(page);
  if (crumbs) {
    graph.push(crumbs);
  }
  const faq = faqSchema(page);
  if (faq) {
    graph.push(faq);
  }
  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

export function jsonLdScript(page: PageDef): string {
  return JSON.stringify(jsonLdForPage(page)).replace(/</g, "\\u003c");
}
