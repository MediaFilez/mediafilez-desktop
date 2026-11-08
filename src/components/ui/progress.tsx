import type { CSSProperties } from "react";
import { cn } from "../../lib/utils";

type ProgressProps = {
  value?: number;
  label?: string;
  indeterminate?: boolean;
  className?: string;
};

export function Progress({ value = 0, label, indeterminate = false, className }: ProgressProps) {
  const boundedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      className={cn("ui-progress", indeterminate && "indeterminate", className)}
      role="progressbar"
      aria-label={label}
      {...(indeterminate
        ? { "aria-valuetext": "In progress" }
        : {
            "aria-valuenow": boundedValue,
            "aria-valuemin": 0,
            "aria-valuemax": 100,
          })}
    >
      <div className="ui-progress-fill" style={{ "--progress": boundedValue / 100 } as CSSProperties} />
    </div>
  );
}
