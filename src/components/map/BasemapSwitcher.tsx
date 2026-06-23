import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { BASEMAPS, type BasemapId } from "@/lib/basemaps";
import { cn } from "@/lib/utils";

const SWATCH: Record<BasemapId, string> = {
  grau: "linear-gradient(135deg,#dadada,#9aa0a6)",
  farbe: "linear-gradient(135deg,#d4e7bd,#9ec6e0)",
  luftbild: "linear-gradient(135deg,#5f7d4d,#36506b)",
};

const SHORT: Record<BasemapId, string> = {
  grau: "Grau",
  farbe: "Farbe",
  luftbild: "Luftbild",
};

function Thumb({
  id,
  selected,
  onClick,
}: {
  id: BasemapId;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={BASEMAPS.find((b) => b.id === id)?.label}
      className={cn(
        "relative size-16 overflow-hidden rounded-md border-2 shadow-sm",
        selected ? "border-zh-blue" : "border-white ring-1 ring-black/10",
      )}
    >
      <span
        className="absolute inset-0"
        style={{ backgroundImage: SWATCH[id] }}
      />
      <span className="absolute inset-x-0 bottom-0 bg-black/55 px-1 py-0.5 text-[10px] font-medium text-white">
        {SHORT[id]}
      </span>
    </button>
  );
}

export function BasemapSwitcher({
  basemapId,
  onChange,
}: {
  basemapId: BasemapId;
  onChange: (id: BasemapId) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <span className="inline-block">
          <Thumb id={basemapId} />
        </span>
      </PopoverTrigger>
      <PopoverContent side="left" align="end" className="w-auto">
        <div className="flex gap-2">
          {BASEMAPS.map((b) => (
            <Thumb
              key={b.id}
              id={b.id}
              selected={b.id === basemapId}
              onClick={() => onChange(b.id)}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
