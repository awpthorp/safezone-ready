import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { legalDocFor } from "../src/content/legal.ts";
import { INDEXABLE_PAGES, OG_IMAGE, OG_IMAGE_ALT, PAGES, SITE_NAME, SITE_ORIGIN } from "../src/seo/pages.ts";

const rootDir = dirname(fileURLToPath(import.meta.url));
const distDir = join(rootDir, "..", "dist");
const templatePath = join(distDir, "index.html");

const NAV = [
  { href: "/", label: "Check" },
  { href: "/meta", label: "Instagram" },
  { href: "/youtube-shorts", label: "Shorts" },
  { href: "/tiktok", label: "TikTok" },
];

function canonicalUrl(path) {
  if (path === "/") {
    return `${SITE_ORIGIN}/`;
  }
  return `${SITE_ORIGIN}${path}`;
}

function jsonLdForPage(page) {
  const url = canonicalUrl(page.path);
  const graph = [
    { "@type": "Organization", name: SITE_NAME, url: SITE_ORIGIN, logo: `${SITE_ORIGIN}/apple-touch-icon.png` },
    {
      "@type": "WebSite",
      name: SITE_NAME,
      url: `${SITE_ORIGIN}/`,
      inLanguage: "en-GB",
      publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_ORIGIN },
    },
    {
      "@type": ["SoftwareApplication", "WebApplication"],
      name: SITE_NAME,
      url: `${SITE_ORIGIN}/`,
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Any",
      offers: { "@type": "Offer", price: "0", priceCurrency: "GBP", description: "Local overlay check" },
    },
    {
      "@type": "WebPage",
      name: page.h1,
      description: page.description,
      url,
      inLanguage: "en-GB",
      isPartOf: { "@type": "WebSite", name: SITE_NAME, url: `${SITE_ORIGIN}/` },
      primaryImageOfPage: { "@type": "ImageObject", url: OG_IMAGE, width: 1200, height: 630 },
    },
  ];
  if (page.path !== "/") {
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_ORIGIN}/` },
        { "@type": "ListItem", position: 2, name: page.h1, item: url },
      ],
    });
  }
  if (page.kind === "home" && page.faq?.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: page.faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

function jsonLdScript(page) {
  if (page.kind === "error") {
    return JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "Organization", name: SITE_NAME, url: SITE_ORIGIN, logo: `${SITE_ORIGIN}/apple-touch-icon.png` },
        { "@type": "WebSite", name: SITE_NAME, url: `${SITE_ORIGIN}/`, inLanguage: "en-GB" },
      ],
    }).replaceAll("<", "\\u003c");
  }
  return JSON.stringify(jsonLdForPage(page)).replaceAll("<", "\\u003c");
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

function setMeta(html, attr, key, content) {
  const re = new RegExp(`<meta\\s+${attr}="${key}"\\s+content="[^"]*"\\s*/?>`, "i");
  const tag = `<meta ${attr}="${key}" content="${escapeAttr(content)}" />`;
  if (re.test(html)) {
    return html.replace(re, tag);
  }
  return html.replace("</head>", `    ${tag}\n  </head>`);
}

function applyHead(html, page, { noindex = false, canonical } = {}) {
  const url = canonical ?? (page.path === "/" ? "https://safezoneready.com/" : `https://safezoneready.com${page.path}`);
  let next = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(page.title)}</title>`);
  next = next.replace(
    /<link rel="canonical" href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${escapeAttr(url)}" />`,
  );
  next = setMeta(next, "name", "description", page.description);
  next = setMeta(next, "property", "og:title", page.ogTitle);
  next = setMeta(next, "property", "og:description", page.description);
  next = setMeta(next, "property", "og:url", url);
  next = setMeta(next, "property", "og:image:alt", OG_IMAGE_ALT);
  next = setMeta(next, "name", "twitter:title", page.ogTitle);
  next = setMeta(next, "name", "twitter:description", page.description);
  if (noindex) {
    next = setMeta(next, "name", "robots", "noindex, nofollow");
  }
  const json = jsonLdScript(page);
  next = next.replace(
    /<script type="application\/ld\+json" id="szr-jsonld">[\s\S]*?<\/script>/,
    `<script type="application/ld+json" id="szr-jsonld">${json}</script>`,
  );
  return next;
}

function headerHtml(activePath) {
  const links = NAV.map((item) => {
    const active = item.href === activePath || (item.href === "/" && activePath === "/");
    const cls = active
      ? "text-primary"
      : "text-muted-foreground hover:text-foreground";
    return `<a href="${item.href}" class="${cls}">${escapeHtml(item.label)}</a>`;
  }).join("");
  return `<header class="border-b border-border">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <a href="/" class="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span class="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground" aria-hidden="true">
            <svg viewBox="0 0 16 16" class="h-3.5 w-3.5" fill="none">
              <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          ${escapeHtml(SITE_NAME)}
        </a>
        <nav aria-label="Primary" class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm sm:gap-x-4">${links}</nav>
      </div>
    </header>`;
}

function footerHtml() {
  return `<footer class="border-t border-border">
      <div class="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>${escapeHtml(SITE_NAME)}</p>
        <nav aria-label="Legal" class="flex flex-wrap items-center gap-x-4 gap-y-1">
          <a class="hover:text-foreground" href="/privacy">Privacy</a>
          <a class="hover:text-foreground" href="/terms">Terms</a>
          <span>Not affiliated with Meta, Google or TikTok.</span>
        </nav>
      </div>
    </footer>`;
}

function dropZoneHtml() {
  return `<section class="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
      <div class="flex flex-col gap-4">
        <div class="flex min-h-[22rem] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center">
          <div>
            <p class="text-base font-medium">Drop the ad still</p>
            <p class="mt-1 text-sm text-muted-foreground">See where Instagram, TikTok and YouTube sit on the offer. The file stays in this tab.</p>
          </div>
          <p class="text-xs text-muted-foreground">PNG, JPEG or WebP.</p>
        </div>
      </div>
      <aside class="flex flex-col gap-4">
        <div class="rounded-lg border border-border bg-card/80 px-3 py-2 text-sm text-muted-foreground">Checks stay on this computer. Nothing uploads until you ask us to move the offer.</div>
      </aside>
    </section>`;
}

function explainerBodyHtml(page, nested) {
  const source = page.kind === "home" ? page.paragraphs : page.paragraphs.slice(1);
  if (!source.length && !page.covers?.length) {
    return "";
  }
  const paragraphs = source
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");
  const covers = page.covers?.length
    ? `<div class="mt-4">
          <p class="text-sm font-medium text-foreground">What this overlay covers</p>
          <ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">${page.covers
            .map((item) => `<li>${escapeHtml(item)}</li>`)
            .join("")}</ul>
        </div>`
    : "";
  const inner = `<div class="flex flex-col gap-3 text-sm text-muted-foreground">${paragraphs}</div>${covers}`;
  if (nested) {
    return `<div class="mt-4 max-w-prose">${inner}</div>`;
  }
  return `<div class="mx-auto max-w-6xl px-4 py-6">${inner}</div>`;
}

function faqHtml(page) {
  if (!page.faq?.length) {
    return "";
  }
  const items = page.faq
    .map(
      (item) => `<div class="rounded-xl border border-border bg-card p-4">
            <dt class="text-sm font-medium">${escapeHtml(item.question)}</dt>
            <dd class="mt-2 text-sm text-muted-foreground">${escapeHtml(item.answer)}</dd>
          </div>`,
    )
    .join("");
  return `<section class="mx-auto max-w-6xl px-4 pb-10" aria-labelledby="faq-heading">
      <h2 id="faq-heading" class="text-lg font-semibold tracking-tight">Questions</h2>
      <dl class="mt-4 grid gap-4">${items}</dl>
    </section>`;
}

function legalHtml(page) {
  const doc = legalDocFor(page.id);
  const sections = doc.sections
    .map((section) => {
      const paragraphs = section.paragraphs
        .map(
          (paragraph) =>
            `<p class="mt-3 text-sm leading-relaxed text-muted-foreground">${escapeHtml(paragraph)}</p>`,
        )
        .join("");
      return `<section class="mt-8">
            <h2 class="text-base font-semibold tracking-tight">${escapeHtml(section.heading)}</h2>
            ${paragraphs}
          </section>`;
    })
    .join("");
  return `<article class="mx-auto max-w-prose px-4 py-10">
        <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">${escapeHtml(doc.h1)}</h1>
        <p class="mt-2 text-sm text-muted-foreground">Last updated ${escapeHtml(doc.updated)}</p>
        ${sections}
      </article>`;
}

function notFoundHtml(page) {
  const paragraphs = page.paragraphs
    .map((paragraph) => `<p class="mt-3 max-w-prose text-sm text-muted-foreground">${escapeHtml(paragraph)}</p>`)
    .join("");
  return `<div class="mx-auto max-w-6xl px-4 py-16">
      <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">${escapeHtml(page.h1)}</h1>
      ${paragraphs}
      <p class="mt-6">
        <a class="text-sm text-primary underline underline-offset-2" href="/">Back to the checker</a>
      </p>
    </div>`;
}

function pageBody(page) {
  if (page.kind === "legal") {
    return legalHtml(page);
  }
  if (page.kind === "error") {
    return notFoundHtml(page);
  }
  const lead = page.kind === "home" ? page.subline : page.paragraphs[0];
  return `<div class="mx-auto max-w-6xl px-4 pt-6 pb-2">
      <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">${escapeHtml(page.h1)}</h1>
      ${lead ? `<p class="mt-2 max-w-prose text-base text-muted-foreground">${escapeHtml(lead)}</p>` : ""}
    </div>
    ${dropZoneHtml()}
    ${explainerBodyHtml(page, false)}
    ${faqHtml(page)}`;
}

function rootHtml(page) {
  return `<a href="#main" class="skip-link">Skip to content</a>
    ${headerHtml(page.path)}
    <div id="main" tabindex="-1">
      ${pageBody(page)}
    </div>
    ${footerHtml()}`;
}

function outputPath(pagePath) {
  if (pagePath === "/") {
    return join(distDir, "index.html");
  }
  return join(distDir, pagePath.slice(1), "index.html");
}

const template = readFileSync(templatePath, "utf8");
if (!template.includes('<div id="root"></div>') && !template.includes('<div id="root">')) {
  throw new Error("prerender: dist/index.html is missing #root");
}

const written = [];
for (const page of INDEXABLE_PAGES) {
  let html = applyHead(template, page);
  html = html.replace(
    /<div id="root"><\/div>/,
    `<div id="root">${rootHtml(page)}</div>`,
  );
  const dest = outputPath(page.path);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, html);
  if (!html.includes(`<title>${page.title}</title>`)) {
    throw new Error(`prerender: missing unique title in ${dest}: ${page.title}`);
  }
  const expectedCanonical =
    page.path === "/" ? "https://safezoneready.com/" : `https://safezoneready.com${page.path}`;
  if (!html.includes(`rel="canonical" href="${expectedCanonical}"`)) {
    throw new Error(`prerender: missing canonical in ${dest}: ${expectedCanonical}`);
  }
  written.push(dest);
}

const notFound = PAGES["not-found"];
let notFoundHtmlPage = applyHead(template, notFound, {
  noindex: true,
  canonical: `${SITE_ORIGIN}/404`,
});
notFoundHtmlPage = notFoundHtmlPage.replace(
  /<div id="root"><\/div>/,
  `<div id="root">${rootHtml(notFound)}</div>`,
);
writeFileSync(join(distDir, "404.html"), notFoundHtmlPage);
if (!notFoundHtmlPage.includes("noindex")) {
  throw new Error("prerender: 404.html missing noindex");
}
console.log(`prerender: wrote ${written.length} pages + 404.html`);
