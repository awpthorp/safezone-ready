import type { FaqItem, PageDef } from "@/seo/pages";

export function Explainer({ page }: { page: PageDef }) {
  const lead = page.kind === "home" ? page.subline : page.paragraphs[0];
  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 pb-2">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{page.h1}</h1>
      {lead ? <p className="mt-2 max-w-prose text-base text-muted-foreground">{lead}</p> : null}
    </div>
  );
}

export function ExplainerBody({ page, nested = false }: { page: PageDef; nested?: boolean }) {
  const paragraphs = page.kind === "home" ? page.paragraphs : page.paragraphs.slice(1);
  if (paragraphs.length === 0 && !page.covers?.length) {
    return null;
  }
  const body = (
    <>
      <div className="flex flex-col gap-3 text-sm text-muted-foreground">
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      {page.covers && page.covers.length > 0 ? (
        <div className="mt-4">
          <p className="text-sm font-medium text-foreground">What this overlay covers</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {page.covers.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );

  if (nested) {
    return <div className="mt-4 max-w-prose">{body}</div>;
  }

  return <div className="mx-auto max-w-6xl px-4 py-6">{body}</div>;
}

export function HomeFaq({ items }: { items: FaqItem[] }) {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-10" aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="text-lg font-semibold tracking-tight">
        Questions
      </h2>
      <dl className="mt-4 grid gap-4">
        {items.map((item) => (
          <div key={item.question} className="rounded-xl border border-border bg-card p-4">
            <dt className="text-sm font-medium">{item.question}</dt>
            <dd className="mt-2 text-sm text-muted-foreground">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
