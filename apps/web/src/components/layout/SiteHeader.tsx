import { Link, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Check", end: true },
  { to: "/meta", label: "Instagram" },
  { to: "/youtube-shorts", label: "Shorts" },
  { to: "/tiktok", label: "TikTok" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground"
            aria-hidden="true"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
              <path
                d="M3.5 8.5 6.5 11.5 12.5 4.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          Safe Zone Ready
        </Link>
        <nav aria-label="Primary" className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm sm:gap-x-4">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn("text-muted-foreground hover:text-foreground", isActive && "text-primary")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
