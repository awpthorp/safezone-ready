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
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{page.h1}</h1>
        {page.paragraphs.map((paragraph) => (
          <p key={paragraph} className="mt-3 max-w-prose text-sm text-muted-foreground">
            {paragraph}
          </p>
        ))}
        <p className="mt-6">
          <Link className="text-sm text-primary underline underline-offset-2" to="/">
            Back to the checker
          </Link>
        </p>
      </div>
    </SiteShell>
  );
}
