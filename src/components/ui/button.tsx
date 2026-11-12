import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-[transform,background-color,border-color,color,opacity] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:pointer-events-none disabled:opacity-40 active:not-disabled:scale-[0.96]",
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-fg hover:bg-accent/90",
        secondary:
          "bg-elevated text-fg border border-border hover:border-accent/40",
        ghost: "text-muted hover:text-fg hover:bg-elevated",
        danger: "bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25",
        answer:
          "bg-elevated text-fg border border-border text-left justify-start items-start hover:border-accent/55",
      },
      size: {
        md: "h-10 px-3 rounded-[12px] text-sm sm:h-11 sm:px-4",
        lg: "h-12 px-5 rounded-[14px] text-base",
        answer: "min-h-11 px-2 py-1.5 rounded-[12px] text-[11px] leading-snug sm:min-h-14 sm:px-3 sm:py-3 sm:rounded-[16px] sm:text-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
