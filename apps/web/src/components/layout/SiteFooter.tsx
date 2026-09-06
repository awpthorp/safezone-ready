import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>Safe Zone Ready</p>
        <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link className="hover:text-foreground" to="/privacy">
            Privacy
          </Link>
          <Link className="hover:text-foreground" to="/terms">
            Terms
          </Link>
          <span>Not affiliated with Meta, Google or TikTok.</span>
        </nav>
      </div>
    </footer>
  );
}
