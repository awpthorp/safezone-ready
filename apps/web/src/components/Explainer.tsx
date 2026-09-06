import type { FaqItem, PageDef } from "@/seo/pages";

function withStop(text: string): string {
  const trimmed = text.trimEnd();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

export function Explainer({ page }: { page: PageDef }) {
  const lead = page.kind === "home" ? page.subline : page.paragraphs[0];
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-2">
      <h1 className="max-w-[20ch] font-display text-5xl tracking-tight text-balance">
        {page.h1}
      </h1>
      {lead ? (
        <p className="mt-4 max-w-[48ch] text-pretty text-lg text-muted-foreground">
          {withStop(lead)}
        </p>
      ) : null}
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
      <div className="flex flex-col gap-3 text-pretty text-base/7 text-muted-foreground sm:text-sm/6">
        {paragraphs.map((paragraph) => (
          <p key={paragraph} className="max-w-[56ch]">
            {paragraph}
          </p>
        ))}
      </div>
      {page.covers && page.covers.length > 0 ? (
        <div className="mt-6">
          <p className="text-base/7 font-medium text-foreground sm:text-sm/6">What this overlay covers</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-base/7 text-muted-foreground sm:text-sm/6">
            {page.covers.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );

  if (nested) {
    return <div className="mt-4">{body}</div>;
  }

  return <div className="mx-auto max-w-6xl px-4 py-8">{body}</div>;
}

const WHY_POINTS = [
  {
    term: "Wasted spend",
    detail:
      "You pay for the impression. If the price, the logo or the shop button sits under likes and captions, the message is unreadable.",
  },
  {
    term: "Brand risk",
    detail:
      "The mark or the claim is what must stay visible. A covered logo is not a brand appearance.",
  },
  {
    term: "Last look",
    detail: "Catch it before Ads Manager, not after the budget is live.",
  },
] as const;

export function WhyItMatters() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8" aria-labelledby="why-heading">
      <h2
        id="why-heading"
        className="max-w-[40ch] font-display text-4xl tracking-tight text-balance"
      >
        Why the safe zone matters
      </h2>
      <p className="mt-4 max-w-[48ch] text-pretty text-lg text-muted-foreground">
        Instagram, TikTok and YouTube draw likes, captions, profile rows and shop buttons on top of
        the file. If the offer sits in that cover, people still see the ad. They do not see the
        deal.
      </p>
      <dl className="mt-6 divide-y divide-zinc-950/10">
        {WHY_POINTS.map((point) => (
          <div key={point.term} className="py-5 first:pt-0 last:pb-0">
            <dt className="text-base/7 font-medium">{point.term}</dt>
            <dd className="mt-2 max-w-[56ch] text-pretty text-base/7 text-muted-foreground sm:text-sm/6">
              {point.detail}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function HomeFaq({ items }: { items: FaqItem[] }) {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16" aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="max-w-[40ch] font-display text-4xl tracking-tight text-balance">
        Questions
      </h2>
      <dl className="mt-6 divide-y divide-zinc-950/10">
        {items.map((item) => (
          <div key={item.question} className="py-5 first:pt-0 last:pb-0">
            <dt className="text-base/7 font-medium">{item.question}</dt>
            <dd className="mt-2 max-w-[56ch] text-pretty text-base/7 text-muted-foreground sm:text-sm/6">
              {item.answer}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
