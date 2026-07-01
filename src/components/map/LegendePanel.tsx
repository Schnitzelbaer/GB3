import { useState } from "react";
import { BookOpen, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { SAMPLE_MAPS } from "@/lib/overlayLayer";

function LegendRow({
  color,
  border,
  label,
}: {
  color: string;
  border: string;
  label: string;
}) {
  return (
    <li className="flex items-center gap-2">
      <span
        className="size-4 shrink-0 rounded-sm"
        style={{ background: color, border: `1.5px solid ${border}` }}
      />
      <span className="text-xs">{label}</span>
    </li>
  );
}

export function LegendePanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="pointer-events-auto relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-10 items-center gap-2 rounded-md border border-black/10 bg-white px-3 text-sm font-medium shadow-md transition-colors hover:bg-muted",
          open && "ring-2 ring-zh-blue",
        )}
      >
        <BookOpen className="size-4 text-zh-blue" />
        Legende
      </button>

      {open && (
        <div className="absolute left-0 top-12 w-72 rounded-md border border-black/10 bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold">Legende</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="text-xs font-semibold text-foreground">
            Aktive Karten
          </div>
          <ul className="mt-2 space-y-1.5">
            {SAMPLE_MAPS.map((m) => (
              <LegendRow
                key={m.id}
                color={`${m.color}66`}
                border={m.color}
                label={m.title}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
