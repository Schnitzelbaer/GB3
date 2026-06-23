import { useState } from "react";
import { Info } from "lucide-react";
import type { Coordinate } from "ol/coordinate";

import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { Switch } from "../ui/switch";
import { useMapInstance } from "@/lib/mapContext";
import {
  formatLv95,
  formatLv03,
  formatWgs84,
  scaleToResolution,
} from "@/lib/swissProjection";

type Fmt = "lv95" | "lv03" | "wgs84";

const SCALE_PRESETS = [500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];

function niceScaleBar(resolution: number) {
  const target = 90 * resolution;
  const pow = Math.pow(10, Math.floor(Math.log10(target)));
  const candidates = [1, 2, 5, 10].map((m) => m * pow);
  let best = candidates[0];
  for (const c of candidates)
    if (Math.abs(c - target) < Math.abs(best - target)) best = c;
  return {
    width: best / resolution,
    label: best >= 1000 ? `${best / 1000} km` : `${best} m`,
  };
}

function chf(n: number) {
  return Math.round(n).toLocaleString("de-CH");
}

export function StatusBar({
  coordinate,
  scale,
  resolution,
  attribution,
}: {
  coordinate: Coordinate | null;
  scale: number;
  resolution: number;
  attribution: string;
}) {
  const map = useMapInstance();
  const [fmt, setFmt] = useState<Fmt>("lv95");
  const [followMouse, setFollowMouse] = useState(true);

  const shown = followMouse ? coordinate : (map?.getView().getCenter() ?? null);
  const coordText = shown
    ? fmt === "lv95"
      ? formatLv95(shown)
      : fmt === "lv03"
        ? formatLv03(shown)
        : formatWgs84(shown)
    : "–";
  const bar = niceScaleBar(resolution);

  function applyScale(s: number) {
    map?.getView().animate({ resolution: scaleToResolution(s), duration: 250 });
  }

  return (
    <div className="flex items-end justify-between gap-2 p-2 text-xs">
      <div className="pointer-events-auto flex items-center gap-3 rounded bg-white/85 px-2 py-1 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col items-center">
          <span className="leading-none">{bar.label}</span>
          <span
            className="mt-1 block h-1.5 border-x border-b border-zinc-700"
            style={{ width: `${bar.width}px` }}
          />
        </div>
        <span className="hidden text-[11px] text-muted-foreground sm:inline">
          {attribution} · Powered by OpenLayers
        </span>
      </div>

      <div className="pointer-events-auto flex items-center gap-0.5 rounded bg-white/90 px-1 py-1 shadow-sm backdrop-blur-sm">
        <Popover>
          <PopoverTrigger asChild>
            <button className="rounded px-2 py-1 font-medium tabular-nums hover:bg-muted">
              1:{chf(scale)}
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="end" className="w-40">
            <div className="px-1 pb-1 text-[11px] font-medium text-muted-foreground">
              Massstab
            </div>
            {SCALE_PRESETS.map((s) => (
              <button
                key={s}
                onClick={() => applyScale(s)}
                className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-muted"
              >
                1:{chf(s)}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        <span className="h-4 w-px bg-border" />

        <Popover>
          <PopoverTrigger asChild>
            <button
              className="rounded px-2 py-1 tabular-nums hover:bg-muted"
              title="Koordinatensystem wechseln"
            >
              {coordText}
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="end" className="w-44">
            <div className="px-1 pb-1 text-[11px] font-medium text-muted-foreground">
              Koordinatensystem
            </div>
            {(
              [
                ["lv95", "LV95 (E / N)"],
                ["lv03", "LV03 (y / x)"],
                ["wgs84", "WGS84 (Lat / Lon)"],
              ] as [Fmt, string][]
            ).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setFmt(k)}
                className={cn(
                  "block w-full rounded px-2 py-1 text-left text-sm hover:bg-muted",
                  fmt === k && "bg-muted font-medium",
                )}
              >
                {l}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        <span className="h-4 w-px bg-border" />

        <Popover>
          <PopoverTrigger asChild>
            <button
              className="grid size-7 place-items-center rounded hover:bg-muted"
              title="Karteninformationen"
            >
              <Info className="size-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="end" className="w-64 p-3 text-xs">
            <div className="font-semibold">GIS-Browser – Prototyp</div>
            <p className="mt-1 leading-relaxed text-muted-foreground">
              Designnachbau des Kartenviewers «Geoportal Kanton Zürich» für
              Feature-Prototyping. Hintergrunddaten: swisstopo (WMTS).
            </p>
          </PopoverContent>
        </Popover>

        <span className="h-4 w-px bg-border" />

        <span
          className="flex items-center px-1.5"
          title="Koordinaten der Mausposition folgen"
        >
          <Switch checked={followMouse} onCheckedChange={setFollowMouse} />
        </span>
      </div>
    </div>
  );
}
