import type { SelectHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="ui-select-wrap">
      <select className={cn("ui-select", className)} {...props}>
        {children}
      </select>
      <svg className="ui-select-arrow" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" >
        <path d="M4.5 6L8 9.5 11.5 6h-7z" />
      </svg>
    </span>
  );
}
