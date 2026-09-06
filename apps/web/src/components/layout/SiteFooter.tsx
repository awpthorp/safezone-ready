import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-950/10">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-display text-xl">Safe Zone Ready</p>
        <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-base/7 text-muted-foreground sm:text-sm/6">
          <Link to="/privacy" className="font-normal">
            Privacy
          </Link>
          <Link to="/terms" className="font-normal">
            Terms
          </Link>
          <span>Not affiliated with Meta, Google or TikTok.</span>
        </nav>
      </div>
    </footer>
  );
}
