import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D946EF] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#D946EF] text-white shadow-sm hover:bg-[#C026D3] active:bg-[#A21CAF]",
        primary:
          "bg-[#D946EF] text-white shadow-sm hover:bg-[#C026D3] active:bg-[#A21CAF]",
        secondary:
          "bg-white text-[#D946EF] border border-[#D946EF] hover:bg-[#FDF4FF]",
        outline:
          "border border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#F9FAFB]",
        ghost: "bg-transparent text-[#111827] hover:bg-[#F3F4F6]",
        link: "text-[#D946EF] underline-offset-4 hover:underline",
        destructive:
          "bg-[#EF4444] text-white shadow-sm hover:bg-[#DC2626]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-md px-3.5 text-xs",
        md: "h-10 px-5 py-2",
        lg: "h-12 rounded-md px-7 text-base",
        icon: "h-10 w-10",
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
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Spinner className="text-current" />
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
