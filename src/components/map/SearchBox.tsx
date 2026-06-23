import { useMemo, useRef, useState } from "react";
import { Search, SlidersHorizontal, X, MapPin, Layers } from "lucide-react";
import type { Coordinate } from "ol/coordinate";

import { cn } from "@/lib/utils";
import { useMapInstance } from "@/lib/mapContext";

interface Suggestion {
  label: string;
  detail: string;
  kind: "ort" | "karte";
  coordinate?: Coordinate;
}

const SUGGESTIONS: Suggestion[] = [
  { label: "Bahnhofstrasse 1", detail: "8001 Zürich", kind: "ort", coordinate: [2683163, 1247208] },
  { label: "Rathaus Zürich", detail: "Limmatquai 55, 8001 Zürich", kind: "ort", coordinate: [2683440, 1247370] },
  { label: "Uetliberg", detail: "Aussichtspunkt, 8143 Stallikon", kind: "ort", coordinate: [2679700, 1243400] },
  { label: "Brunau", detail: "Quartier, 8002 Zürich", kind: "ort", coordinate: [2681900, 1244900] },
  { label: "Friedhof Manegg", detail: "8045 Zürich", kind: "ort", coordinate: [2681600, 1244400] },
  { label: "Pflegeplan Naturschutz-Teilflächen", detail: "Karte · Flora und Fauna", kind: "karte" },
  { label: "Gefahrenkarte", detail: "Karte · Naturgefahren", kind: "karte" },
  { label: "Bauzonen Kanton Zürich", detail: "Karte · Bauten", kind: "karte" },
];

export function SearchBox() {
  const map = useMapInstance();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const blurTimer = useRef<number | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return SUGGESTIONS.filter(
      (s) =>
        s.label.toLowerCase().includes(q) || s.detail.toLowerCase().includes(q),
    ).slice(0, 6);
  }, [query]);

  function flyTo(coordinate?: Coordinate) {
    if (!map || !coordinate) return;
    map.getView().animate({ center: coordinate, resolution: 0.5, duration: 600 });
  }

  const open = focused && results.length > 0;

  return (
    <div className="pointer-events-auto w-full max-w-[640px]">
      <div
        className={cn(
          "flex items-center gap-2 rounded-md border border-black/10 bg-white px-3 shadow-md",
          "h-11",
        )}
      >
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            blurTimer.current = window.setTimeout(() => setFocused(false), 150);
          }}
          placeholder="Suchen nach Adressen, Orten, Karten und mehr..."
          className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          title="Suchoptionen"
          className="grid size-7 place-items-center rounded text-muted-foreground hover:bg-muted"
        >
          <SlidersHorizontal className="size-4" />
        </button>
        <div className="h-5 w-px bg-border" />
        <button
          type="button"
          title="Leeren"
          onClick={() => setQuery("")}
          className="grid size-7 place-items-center rounded text-muted-foreground hover:bg-muted"
        >
          <X className="size-4" />
        </button>
      </div>

      {open && (
        <div className="mt-1.5 overflow-hidden rounded-md border border-black/10 bg-white py-1 shadow-lg">
          {results.map((s, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                flyTo(s.coordinate);
                if (blurTimer.current) window.clearTimeout(blurTimer.current);
                setFocused(false);
              }}
              className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted"
            >
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded",
                  s.kind === "ort"
                    ? "bg-zh-blue/10 text-zh-blue"
                    : "bg-amber-500/15 text-amber-700",
                )}
              >
                {s.kind === "ort" ? (
                  <MapPin className="size-4" />
                ) : (
                  <Layers className="size-4" />
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">
                  {s.label}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {s.detail}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
