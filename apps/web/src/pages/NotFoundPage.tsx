import { Link } from "react-router-dom";
import { SiteShell } from "@/components/layout/SiteShell";
import { SeoHead } from "@/components/SeoHead";
import { PAGES } from "@/seo/pages";

export function NotFoundPage() {
  const page = PAGES["not-found"];

  return (
    <SiteShell>
      <SeoHead page={page} noindex />
      <div className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="max-w-[20ch] font-display text-5xl tracking-tight text-balance">{page.h1}</h1>
        {page.paragraphs.map((paragraph) => (
          <p key={paragraph} className="mt-4 max-w-[48ch] text-pretty text-lg text-muted-foreground">
            {paragraph}
          </p>
        ))}
        <p className="mt-8">
          <Link className="text-base/7 underline underline-offset-2 sm:text-sm/6" to="/">
            Back to the checker
          </Link>
        </p>
      </div>
    </SiteShell>
  );
}
