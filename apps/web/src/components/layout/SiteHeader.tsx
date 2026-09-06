import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Check", end: true },
  { to: "/meta", label: "Instagram" },
  { to: "/youtube-shorts", label: "Shorts" },
  { to: "/tiktok", label: "TikTok" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-zinc-950/10 bg-background">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <div className="flex flex-1 items-center">
          <Link to="/" aria-label="Homepage" className="font-display text-2xl tracking-tight">
            Safe Zone Ready
          </Link>
        </div>
        <nav aria-label="Primary" className="flex items-center gap-x-6 max-lg:hidden">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "cursor-pointer text-base/7 text-muted-foreground sm:text-sm/6",
                  isActive && "text-foreground",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex flex-1 items-center justify-end">
          <button
            type="button"
            className="relative size-9 cursor-pointer lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5 shrink-0" /> : <Menu className="size-5 shrink-0" />}
            <span className="pointer-fine:hidden absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2" aria-hidden="true" />
          </button>
        </div>
      </div>
      {open ? (
        <nav
          id="mobile-nav"
          aria-label="Primary"
          className="flex flex-col gap-1 border-t border-zinc-950/10 px-4 py-3 lg:hidden"
        >
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "cursor-pointer rounded-md px-2 py-2 text-base/7",
                  isActive ? "bg-muted text-foreground" : "text-muted-foreground",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
