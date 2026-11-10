import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { cn } from "@/lib/utils";

type ScrollOrientation = "vertical" | "horizontal" | "both";

interface ScrollAreaProps extends React.ComponentProps<typeof ScrollAreaPrimitive.Root> {
  orientation?: ScrollOrientation;
}

const scrollbarClass =
  "flex touch-none select-none bg-[var(--scrollbar-track)] p-0.5 transition-colors";
const thumbClass =
  "relative flex-1 rounded-full bg-[var(--scrollbar-thumb)] transition-colors hover:bg-[var(--scrollbar-thumb-hover)]";

export function ScrollArea({
  className,
  children,
  orientation = "vertical",
  ...props
}: ScrollAreaProps) {
  const showVertical = orientation === "vertical" || orientation === "both";
  const showHorizontal = orientation === "horizontal" || orientation === "both";

  return (
    <ScrollAreaPrimitive.Root className={cn("relative overflow-hidden", className)} {...props}>
      <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
        {children}
      </ScrollAreaPrimitive.Viewport>
      {showVertical && (
        <ScrollAreaPrimitive.Scrollbar orientation="vertical" className={scrollbarClass}>
          <ScrollAreaPrimitive.Thumb className={thumbClass} />
        </ScrollAreaPrimitive.Scrollbar>
      )}
      {showHorizontal && (
        <ScrollAreaPrimitive.Scrollbar orientation="horizontal" className={scrollbarClass}>
          <ScrollAreaPrimitive.Thumb className={thumbClass} />
        </ScrollAreaPrimitive.Scrollbar>
      )}
      {showVertical && showHorizontal && <ScrollAreaPrimitive.Corner />}
    </ScrollAreaPrimitive.Root>
  );
}
