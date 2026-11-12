import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-elevated text-muted border border-border",
        sage: "bg-accent/15 text-accent border border-accent/25",
        success: "bg-success/15 text-success border border-success/25",
        danger: "bg-danger/15 text-danger border border-danger/25",
        warn: "bg-warn/15 text-warn border border-warn/25",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
