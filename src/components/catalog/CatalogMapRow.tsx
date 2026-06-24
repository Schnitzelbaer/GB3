import { Plus, Check } from "lucide-react";

import { cn } from "@/lib/utils";

function thumbHue(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
}

/** The small map preview tile used across the catalog and the Datasets tab. */
export function MapThumb({
  id,
  badge,
}: {
  id: string;
  badge?: "add" | "check" | "none";
}) {
  const h = thumbHue(id);
  return (
    <span
      className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-sm ring-1 ring-black/10"
      style={{
        backgroundImage: `linear-gradient(135deg, hsl(${h} 50% 82%), hsl(${(h + 45) % 360} 55% 60%))`,
      }}
    >
      <span
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg,transparent 0 6px,rgba(255,255,255,.6) 6px 7px),repeating-linear-gradient(0deg,transparent 0 6px,rgba(255,255,255,.6) 6px 7px)",
        }}
      />
      {badge === "add" && (
        <span className="absolute bottom-0 right-0 grid size-4 place-items-center rounded-tl bg-zh-blue text-white">
          <Plus className="size-3" />
        </span>
      )}
      {badge === "check" && (
        <span className="absolute bottom-0 left-0 grid size-4 place-items-center rounded-tr bg-zh-blue text-white">
          <Check className="size-3" />
        </span>
      )}
    </span>
  );
}

/** A catalog map row: thumbnail (add/active), title, optional hit count + trailing. */
export function CatalogMapRow({
  id,
  title,
  isActive,
  onAdd,
  hitCount,
  trailing,
}: {
  id: string;
  title: string;
  isActive: boolean;
  onAdd: () => void;
  hitCount?: number;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 hover:bg-muted/60">
      <button
        type="button"
        title={isActive ? "Bereits aktiv" : "Zur Karte hinzufügen"}
        disabled={isActive}
        onClick={onAdd}
        className={cn(isActive && "opacity-60")}
      >
        <MapThumb id={id} badge={isActive ? "check" : "add"} />
      </button>
      <span className="line-clamp-2 min-w-0 flex-1 text-[13px] leading-tight">
        {title}
      </span>
      {hitCount != null && (
        <span
          className="shrink-0 rounded-full bg-zh-blue/10 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-zh-blue"
          title={`${hitCount} Objekt(e) an dieser Stelle`}
        >
          {hitCount}
        </span>
      )}
      {trailing}
    </div>
  );
}
