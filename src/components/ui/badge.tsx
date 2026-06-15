import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#FDF4FF] text-[#A21CAF]",
        success: "border-transparent bg-[#ECFDF5] text-[#047857]",
        warning: "border-transparent bg-[#FFFBEB] text-[#B45309]",
        "sold-out": "border-transparent bg-[#FEE2E2] text-[#B91C1C]",
        outline: "border-[#E5E7EB] text-[#111827] bg-white",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
