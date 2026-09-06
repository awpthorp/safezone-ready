import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex cursor-pointer items-center justify-center gap-2 rounded-md font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground ring-1 ring-primary",
        secondary: "bg-secondary text-secondary-foreground ring-1 ring-zinc-950/10",
        outline: "bg-transparent text-foreground ring-1 ring-zinc-950/15",
        ghost: "bg-transparent text-foreground",
        destructive: "bg-secondary text-destructive ring-1 ring-zinc-950/10",
      },
      size: {
        default: "h-9 px-3 py-2 text-base sm:h-8 sm:text-sm",
        sm: "h-8 px-2.5 py-1.5 text-base sm:h-7 sm:text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export function Button({
  className,
  variant,
  size,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return (
    <button type="button" className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {children}
      <span
        className="pointer-fine:hidden absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2"
        aria-hidden="true"
      />
    </button>
  );
}
