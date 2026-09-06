import { SiteShell } from "@/components/layout/SiteShell";
import { SeoHead } from "@/components/SeoHead";
import { legalDocFor } from "@/content/legal";
import { PAGES } from "@/seo/pages";

export function LegalPage({ kind }: { kind: "privacy" | "terms" }) {
  const page = PAGES[kind];
  const doc = legalDocFor(kind);

  return (
    <SiteShell>
      <SeoHead page={page} />
      <article className="mx-auto max-w-prose px-4 py-12">
        <h1 className="font-display text-5xl tracking-tight text-balance">{doc.h1}</h1>
        <p className="mt-3 text-base/7 text-muted-foreground sm:text-sm/6">Last updated {doc.updated}.</p>
        {doc.sections.map((section) => (
          <section key={section.heading} className="mt-10">
            <h2 className="text-xl font-semibold text-balance">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-3 text-pretty text-base/7 text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </article>
    </SiteShell>
  );
}
