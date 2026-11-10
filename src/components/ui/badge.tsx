import { cn } from "@/lib/utils";
import type { IndicatorColor } from "@/lib/colors";
import { indicatorClasses } from "@/lib/colors";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: IndicatorColor;
}

export function Badge({ className, color = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        indicatorClasses[color],
        className,
      )}
      {...props}
    />
  );
}
