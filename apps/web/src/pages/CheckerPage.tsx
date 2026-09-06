import type { PlacementId } from "@safezone-ready/safezone-specs";
import { Checker } from "@/components/Checker";
import { Explainer, ExplainerBody, HomeFaq, WhyItMatters } from "@/components/Explainer";
import { SiteShell } from "@/components/layout/SiteShell";
import { SeoHead } from "@/components/SeoHead";
import { PAGES, type PageId } from "@/seo/pages";

type CheckerPageId = Extract<PageId, "home" | "meta" | "youtube-shorts" | "tiktok">;

export function CheckerPage({ pageId }: { pageId: CheckerPageId }) {
  const page = PAGES[pageId];
  const placement = (page.placement ?? "combined") as PlacementId;

  return (
    <SiteShell>
      <SeoHead page={page} />
      <Explainer page={page} />
      <Checker key={placement} defaultPlacement={placement} />
      <WhyItMatters />
      <ExplainerBody page={page} />
      {page.faq ? <HomeFaq items={page.faq} /> : null}
    </SiteShell>
  );
}
