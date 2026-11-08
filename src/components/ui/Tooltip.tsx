import { type HTMLAttributes, type ReactNode, useEffect, useRef, useState } from "react";

type TooltipProps = HTMLAttributes<HTMLDivElement> & {
  content: string;
  children: ReactNode;
  delayMs?: number;
  side?: "top" | "bottom" | "left" | "right";
};

export function Tooltip({ content, children, delayMs = 500, side = "top", className, ...props }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setVisible(true);
    }, delayMs);
  };

  const hide = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className={`tooltip-wrapper ${className ?? ""}`} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide} {...props}>
      {children}
      {visible && (
        <span className={`tooltip-bubble tooltip-${side}`} role="tooltip" aria-hidden="true">
          {content}
        </span>
      )}
    </div>
  );
}
