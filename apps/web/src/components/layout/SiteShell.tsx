import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="isolate min-h-dvh bg-background">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader />
      <div id="main" tabIndex={-1}>
        {children}
      </div>
      <SiteFooter />
    </div>
  );
}
