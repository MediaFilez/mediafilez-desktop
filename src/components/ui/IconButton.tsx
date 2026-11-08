import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Tooltip } from "./Tooltip";

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
  tooltipDelayMs?: number;
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, children, className, tooltipDelayMs = 500, type = "button", ...props }, ref) => {
    return (
      <Tooltip content={label} delayMs={tooltipDelayMs}>
        <button ref={ref} type={type} aria-label={label} className={`icon-button ${className ?? ""}`.trim()} {...props} >
          {children}
        </button>
      </Tooltip>
    );
  },
);

IconButton.displayName = "IconButton";
