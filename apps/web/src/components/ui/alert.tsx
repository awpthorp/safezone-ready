import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Alert({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      className={cn("rounded-md bg-muted px-3 py-2 text-base/7 text-muted-foreground sm:text-sm/6", className)}
      {...props}
    />
  );
}

export function AlertError({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="alert"
      className={cn("rounded-md bg-risk/10 px-3 py-2 text-base/7 text-risk sm:text-sm/6", className)}
      {...props}
    />
  );
}
