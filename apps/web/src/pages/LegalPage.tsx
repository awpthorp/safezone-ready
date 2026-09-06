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
      <article className="mx-auto max-w-prose px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{doc.h1}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated {doc.updated}</p>
        {doc.sections.map((section) => (
          <section key={section.heading} className="mt-8">
            <h2 className="text-base font-semibold tracking-tight">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </article>
    </SiteShell>
  );
}
