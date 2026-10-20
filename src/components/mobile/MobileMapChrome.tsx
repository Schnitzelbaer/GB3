import { Layers, List, LocateFixed, Map as MapIcon, Menu, Share2 } from "lucide-react";

import { useMapInstance } from "@/lib/mapContext";
import type { BasemapId } from "@/lib/basemaps";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { BasemapSwitcher } from "../map/BasemapSwitcher";
import { LegendList } from "../map/LegendePanel";
import { locate } from "../map/NavControls";

const ICON_BTN =
  "grid size-11 place-items-center text-foreground transition-colors active:bg-muted";

/**
 * Map controls for small screens, modelled on the GIS-Browser mobile view:
 * icon bar top-left, menu top-right, maps button and attribution at the
 * bottom. The search bar is rendered by the search itself.
 */
export function MobileMapChrome({
  basemapId,
  onChangeBasemap,
  onOpenMenu,
  onOpenMaps,
}: {
  basemapId: BasemapId;
  onChangeBasemap: (id: BasemapId) => void;
  onOpenMenu: () => void;
  onOpenMaps: () => void;
}) {
  const map = useMapInstance();
  const divider = <span className="my-2.5 w-px bg-border" />;

  return (
    <>
      {/* top-left icon bar */}
      <div className="absolute left-3 top-3 z-10 flex rounded-md bg-white shadow-md">
        <button type="button" aria-label="Teilen" className={ICON_BTN}>
          <Share2 className="size-5" />
        </button>
        {divider}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" aria-label="Legende" className={ICON_BTN}>
              <List className="size-5" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="start" className="w-72 p-3">
            <div className="mb-2 text-sm font-semibold">Legende</div>
            <LegendList />
          </PopoverContent>
        </Popover>
        {divider}
        <button
          type="button"
          aria-label="Standort"
          onClick={() => locate(map)}
          className={ICON_BTN}
        >
          <LocateFixed className="size-5" />
        </button>
        {divider}
        <BasemapSwitcher
          basemapId={basemapId}
          onChange={onChangeBasemap}
          side="bottom"
          align="start"
          trigger={
            <button type="button" aria-label="Hintergrundkarte" className={ICON_BTN}>
              <Layers className="size-5" />
            </button>
          }
        />
      </div>

      {/* top-right menu */}
      <button
        type="button"
        aria-label="Menü"
        onClick={onOpenMenu}
        className="absolute right-3 top-3 z-10 grid size-11 place-items-center rounded-md bg-white shadow-md"
      >
        <Menu className="size-6" />
      </button>

      {/* bottom-right: active maps & catalogue, above the search bar */}
      <button
        type="button"
        aria-label="Karten"
        onClick={onOpenMaps}
        className="absolute bottom-[5.5rem] right-3 z-10 grid size-12 place-items-center rounded-md bg-white shadow-md"
      >
        <MapIcon className="size-5" />
      </button>

      {/* attribution */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex h-6 items-center justify-between bg-white/85 px-2 text-[11px] text-muted-foreground">
        <span>© swisstopo / Kanton Zürich</span>
        <span>Powered by OpenLayers</span>
      </div>
    </>
  );
}
