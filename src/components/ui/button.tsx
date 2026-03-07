import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-300 ease-out active:scale-95 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-500 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-[0_0_15px_-3px_rgba(249,115,22,0.4)] hover:shadow-[0_0_20px_-3px_rgba(249,115,22,0.6)] hover:brightness-110",
        destructive:
          "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg hover:brightness-110",
        outline:
          "border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 hover:border-white/20 text-zinc-50 ring-1 ring-white/5",
        secondary:
          "bg-zinc-800/80 backdrop-blur-md text-zinc-50 hover:bg-zinc-800 ring-1 ring-white/5",
        ghost: "hover:bg-white/10 hover:text-zinc-50 backdrop-blur-sm",
        link: "text-orange-400 underline-offset-4 hover:underline hover:text-orange-300",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
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
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
