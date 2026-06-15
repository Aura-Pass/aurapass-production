import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<"input"> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, id, ...props }, ref) => {
    const autoId = React.useId();
    const inputId = id ?? autoId;
    return (
      <div className="w-full space-y-1.5">
        {label ? (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[#111827]"
          >
            {label}
          </label>
        ) : null}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            "flex h-11 w-full rounded-md border border-[#E5E7EB] bg-white px-3.5 py-2 text-sm text-[#111827] shadow-sm transition-colors placeholder:text-[#9CA3AF] focus-visible:outline-none focus-visible:border-[#D946EF] focus-visible:ring-2 focus-visible:ring-[#D946EF]/30 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-[#EF4444] focus-visible:border-[#EF4444] focus-visible:ring-[#EF4444]/30",
            className,
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs font-medium text-[#EF4444]">{error}</p>
        ) : hint ? (
          <p className="text-xs text-[#6B7280]">{hint}</p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
