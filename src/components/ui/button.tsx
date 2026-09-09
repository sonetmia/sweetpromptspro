import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border font-semibold cursor-pointer select-none overflow-hidden transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/80 before:opacity-80 after:absolute after:inset-0 after:rounded-[inherit] after:pointer-events-none",
  {
    variants: {
      variant: {
        default:
          "border-white/70 bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-primary-foreground shadow-[6px_6px_14px_rgba(15,23,42,0.18),-5px_-5px_12px_rgba(255,255,255,0.9),inset_1px_1px_1px_rgba(255,255,255,0.45),inset_-2px_-2px_5px_rgba(15,23,42,0.12)] hover:-translate-y-0.5 hover:shadow-[8px_8px_18px_rgba(15,23,42,0.2),-6px_-6px_14px_rgba(255,255,255,0.92),inset_1px_1px_1px_rgba(255,255,255,0.5),inset_-2px_-2px_6px_rgba(15,23,42,0.14)] active:translate-y-[1px] active:shadow-[inset_2px_2px_6px_rgba(15,23,42,0.18),inset_-1px_-1px_3px_rgba(255,255,255,0.45)]",
        destructive:
          "border-destructive/20 bg-gradient-to-br from-destructive to-destructive/85 text-destructive-foreground shadow-[5px_5px_12px_rgba(15,23,42,0.14),-4px_-4px_10px_rgba(255,255,255,0.82),inset_1px_1px_1px_rgba(255,255,255,0.35)] hover:-translate-y-0.5 hover:brightness-105 active:translate-y-[1px] active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.18)]",
        outline:
          "border-white/80 bg-background/80 text-foreground shadow-[5px_5px_12px_rgba(15,23,42,0.12),-5px_-5px_12px_rgba(255,255,255,0.95),inset_1px_1px_1px_rgba(255,255,255,0.75),inset_-1px_-1px_2px_rgba(15,23,42,0.04)] backdrop-blur-sm hover:-translate-y-0.5 hover:bg-background hover:border-primary/20 hover:text-primary hover:shadow-[7px_7px_16px_rgba(15,23,42,0.14),-6px_-6px_14px_rgba(255,255,255,0.98),inset_1px_1px_1px_rgba(255,255,255,0.8)] active:translate-y-[1px] active:shadow-[inset_2px_2px_5px_rgba(15,23,42,0.1),inset_-1px_-1px_3px_rgba(255,255,255,0.8)]",
        secondary:
          "border-white/80 bg-secondary text-secondary-foreground shadow-[5px_5px_12px_rgba(15,23,42,0.12),-5px_-5px_12px_rgba(255,255,255,0.95),inset_1px_1px_1px_rgba(255,255,255,0.7)] hover:-translate-y-0.5 hover:brightness-[1.02] active:translate-y-[1px] active:shadow-[inset_2px_2px_5px_rgba(15,23,42,0.1)]",
        ghost:
          "border-transparent bg-transparent text-foreground shadow-none hover:border-white/70 hover:bg-background/70 hover:shadow-[4px_4px_10px_rgba(15,23,42,0.1),-4px_-4px_10px_rgba(255,255,255,0.9)] hover:text-primary active:translate-y-[1px]",
        link:
          "border-transparent bg-transparent p-0 text-primary shadow-none after:hidden hover:underline hover:underline-offset-4",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3.5 text-xs",
        lg: "h-12 rounded-2xl px-7 text-sm",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
