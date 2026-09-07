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
    const active = item.href === activePath;
    const cls = active
      ? "text-base/7 text-foreground sm:text-sm/6"
      : "text-base/7 text-muted-foreground sm:text-sm/6";
    return `<a href="${item.href}" class="${cls}">${escapeHtml(item.label)}</a>`;
  }).join("");
  return `<header class="border-b border-zinc-950/10 bg-background">
      <div class="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <div class="flex flex-1 items-center">
          <a href="/" aria-label="Homepage" class="font-display text-2xl tracking-tight">${escapeHtml(SITE_NAME)}</a>
        </div>
        <nav aria-label="Primary" class="flex items-center gap-x-6">${links}</nav>
        <div class="flex flex-1"></div>
      </div>
    </header>`;
}

function footerHtml() {
  return `<footer class="border-t border-zinc-950/10">
      <div class="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p class="font-display text-xl">${escapeHtml(SITE_NAME)}</p>
        <nav aria-label="Legal" class="flex flex-wrap items-center gap-x-5 gap-y-2 text-base/7 text-muted-foreground sm:text-sm/6">
          <a class="font-normal" href="/privacy">Privacy</a>
          <a class="font-normal" href="/terms">Terms</a>
          <span>Not affiliated with Meta, Google or TikTok.</span>
        </nav>
        <a href="https://www.launchdub.ai" title="Featured on LaunchDubai" data-launchdub-badge>
          <img
            src="https://www.launchdub.ai/badge/launchdubai-badge-dark.svg"
            alt="Featured on LaunchDubai"
            width="216"
            height="64"
            style="width: 162px; height: auto"
          />
        </a>
      </div>
    </footer>`;
}

function dropZoneHtml() {
  return `<section class="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
      <div class="flex min-w-0 flex-col gap-4">
        <div class="flex min-h-[22rem] flex-col items-center justify-center gap-4 rounded-(--radius) bg-white px-6 py-10 text-center ring-1 ring-zinc-950/10">
          <div>
            <p class="text-lg font-medium">Drop the still or clip</p>
            <p class="mt-2 max-w-[40ch] text-pretty text-base/7 text-muted-foreground sm:text-sm/6">See Instagram, TikTok and YouTube chrome on the offer. The file stays in this tab.</p>
          </div>
          <p class="text-base/7 text-muted-foreground sm:text-sm/6">PNG, JPEG, WebP, MP4 or WebM.</p>
        </div>
      </div>
      <aside class="flex flex-col gap-4">
        <div class="rounded-md bg-muted px-3 py-2 text-base/7 text-muted-foreground sm:text-sm/6">Scoring runs in your browser. The file is not uploaded unless you ask for an AI edit.</div>
      </aside>
    </section>`;
}

function withStop(text) {
  const trimmed = text.trimEnd();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function whyItMattersHtml() {
  const points = [
    [
      "Wasted spend",
      "You pay for the impression. If the price, the logo or the shop button sits under likes and captions, the message is unreadable.",
    ],
    [
      "Brand risk",
      "The mark or the claim is what must stay visible. A covered logo is not a brand appearance.",
    ],
    ["Last look", "Catch it before Ads Manager, not after the budget is live."],
  ];
  const items = points
    .map(
      ([term, detail]) => `<div class="py-5 first:pt-0 last:pb-0">
            <dt class="text-base/7 font-medium">${escapeHtml(term)}</dt>
            <dd class="mt-2 max-w-[56ch] text-pretty text-base/7 text-muted-foreground sm:text-sm/6">${escapeHtml(detail)}</dd>
          </div>`,
    )
    .join("");
  return `<section class="mx-auto max-w-6xl px-4 py-8" aria-labelledby="why-heading">
      <h2 id="why-heading" class="max-w-[40ch] font-display text-4xl tracking-tight text-balance">Why the safe zone matters</h2>
      <p class="mt-4 max-w-[48ch] text-pretty text-lg text-muted-foreground">Instagram, TikTok and YouTube draw likes, captions, profile rows and shop buttons on top of the file. If the offer sits in that cover, people still see the ad. They do not see the deal.</p>
      <dl class="mt-6 divide-y divide-zinc-950/10">${items}</dl>
    </section>`;
}

function goodBadHtml() {
  return `<section class="mx-auto max-w-6xl px-4 py-8" aria-labelledby="examples-heading">
      <h2 id="examples-heading" class="max-w-[40ch] font-display text-4xl tracking-tight text-balance">A bad still and a good still</h2>
      <p class="mt-4 max-w-[48ch] text-pretty text-lg text-muted-foreground">Same serum, same 9:16 frame. The only change is where the 50% off sits.</p>
      <div class="mt-8 grid gap-8 sm:grid-cols-2">
        <figure>
          <h3 class="text-base/7 font-semibold sm:text-sm/6">Bad</h3>
          <figcaption class="mt-3 max-w-[40ch] text-pretty text-base/7 text-muted-foreground sm:text-sm/6">The 50% off sits in the caption band. Instagram draws the caption, shop button and tab bar on top of it. You pay for an impression of a price nobody can read.</figcaption>
        </figure>
        <figure>
          <h3 class="text-base/7 font-semibold sm:text-sm/6">Good</h3>
          <figcaption class="mt-3 max-w-[40ch] text-pretty text-base/7 text-muted-foreground sm:text-sm/6">The 50% off sits in the hole. Likes, caption and shop still appear. The price stays readable.</figcaption>
        </figure>
      </div>
    </section>`;
}

function explainerBodyHtml(page, nested) {
  const source = page.kind === "home" ? page.paragraphs : page.paragraphs.slice(1);
  if (!source.length && !page.covers?.length) {
    return "";
  }
  const paragraphs = source
    .map((paragraph) => `<p class="max-w-[56ch]">${escapeHtml(paragraph)}</p>`)
    .join("");
  const covers = page.covers?.length
    ? `<div class="mt-6">
          <p class="text-base/7 font-medium text-foreground sm:text-sm/6">What this overlay covers</p>
          <ul class="mt-2 list-disc space-y-1 pl-5 text-base/7 text-muted-foreground sm:text-sm/6">${page.covers
            .map((item) => `<li>${escapeHtml(item)}</li>`)
            .join("")}</ul>
        </div>`
    : "";
  const inner = `<div class="flex flex-col gap-3 text-pretty text-base/7 text-muted-foreground sm:text-sm/6">${paragraphs}</div>${covers}`;
  if (nested) {
    return `<div class="mt-4">${inner}</div>`;
  }
  return `<div class="mx-auto max-w-6xl px-4 py-8">${inner}</div>`;
}

function faqHtml(page) {
  if (!page.faq?.length) {
    return "";
  }
  const items = page.faq
    .map(
      (item) => `<div class="py-5 first:pt-0 last:pb-0">
            <dt class="text-base/7 font-medium">${escapeHtml(item.question)}</dt>
            <dd class="mt-2 max-w-[56ch] text-pretty text-base/7 text-muted-foreground sm:text-sm/6">${escapeHtml(item.answer)}</dd>
          </div>`,
    )
    .join("");
  return `<section class="mx-auto max-w-6xl px-4 pb-16" aria-labelledby="faq-heading">
      <h2 id="faq-heading" class="max-w-[40ch] font-display text-4xl tracking-tight text-balance">Questions</h2>
      <dl class="mt-6 divide-y divide-zinc-950/10">${items}</dl>
    </section>`;
}

function legalHtml(page) {
  const doc = legalDocFor(page.id);
  const sections = doc.sections
    .map((section) => {
      const paragraphs = section.paragraphs
        .map(
          (paragraph) =>
            `<p class="mt-3 text-pretty text-base/7 text-muted-foreground">${escapeHtml(paragraph)}</p>`,
        )
        .join("");
      return `<section class="mt-10">
            <h2 class="text-xl font-semibold text-balance">${escapeHtml(section.heading)}</h2>
            ${paragraphs}
          </section>`;
    })
    .join("");
  return `<article class="mx-auto max-w-prose px-4 py-12">
        <h1 class="font-display text-5xl tracking-tight text-balance">${escapeHtml(doc.h1)}</h1>
        <p class="mt-3 text-base/7 text-muted-foreground sm:text-sm/6">Last updated ${escapeHtml(doc.updated)}.</p>
        ${sections}
      </article>`;
}

function notFoundHtml(page) {
  const paragraphs = page.paragraphs
    .map(
      (paragraph) =>
        `<p class="mt-4 max-w-[48ch] text-pretty text-lg text-muted-foreground">${escapeHtml(paragraph)}</p>`,
    )
    .join("");
  return `<div class="mx-auto max-w-6xl px-4 py-16">
      <h1 class="max-w-[20ch] font-display text-5xl tracking-tight text-balance">${escapeHtml(page.h1)}</h1>
      ${paragraphs}
      <p class="mt-8">
        <a class="text-base/7 underline underline-offset-2 sm:text-sm/6" href="/">Back to the checker</a>
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
  return `<div class="mx-auto max-w-6xl px-4 pt-10 pb-2">
      <h1 class="max-w-[30ch] font-display text-5xl tracking-tight text-balance">${escapeHtml(page.h1)}</h1>
      ${lead ? `<p class="mt-4 max-w-[48ch] text-pretty text-lg text-muted-foreground">${escapeHtml(withStop(lead))}</p>` : ""}
    </div>
    ${dropZoneHtml()}
    ${whyItMattersHtml()}
    ${goodBadHtml()}
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
