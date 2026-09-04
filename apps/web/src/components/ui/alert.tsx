import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Alert({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      className={cn("rounded-lg border border-border bg-card/80 px-3 py-2 text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export function AlertError({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="alert"
      className={cn("rounded-lg border border-risk/40 bg-risk/10 px-3 py-2 text-sm text-risk", className)}
      {...props}
    />
  );
}
