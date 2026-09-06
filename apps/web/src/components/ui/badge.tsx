import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-md px-2 py-0.5 text-base font-medium sm:text-sm", {
  variants: {
    variant: {
      default: "bg-muted text-foreground",
      ready: "bg-ready/10 text-ready",
      caution: "bg-caution/10 text-caution",
      risk: "bg-risk/10 text-risk",
      outline: "ring-1 ring-zinc-950/10 text-muted-foreground",
    },
  },
  defaultVariants: { variant: "default" },
});

export function Badge({
  className,
  variant,
  ...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
