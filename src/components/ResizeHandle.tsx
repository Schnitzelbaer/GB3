import { useCallback } from "react";
import { GripVertical } from "lucide-react";

import { cn } from "@/lib/utils";

export function ResizeHandle({
  onResize,
  className,
}: {
  /** Called continuously during drag with the pointer's clientX. */
  onResize: (clientX: number) => void;
  className?: string;
}) {
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const move = (ev: PointerEvent) => onResize(ev.clientX);
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [onResize],
  );

  return (
    <div
      onPointerDown={onPointerDown}
      className={cn(
        "group relative z-20 flex w-1.5 shrink-0 cursor-col-resize items-center justify-center bg-border/70 transition-colors hover:bg-zh-blue/40",
        className,
      )}
    >
      <GripVertical className="pointer-events-none size-3.5 text-zinc-400 group-hover:text-zh-blue" />
    </div>
  );
}
