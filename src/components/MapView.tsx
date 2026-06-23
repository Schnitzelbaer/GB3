import { useEffect, useRef, useState } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import Overlay from "ol/Overlay";
import type WMTS from "ol/source/WMTS";
import type { Coordinate } from "ol/coordinate";
import { PanelLeftOpen } from "lucide-react";

import { MapContext } from "@/lib/mapContext";
import {
  SWISS_PROJECTION,
  INITIAL_CENTER,
  INITIAL_SCALE,
  scaleToResolution,
  resolutionToScale,
} from "@/lib/swissProjection";
import { BASEMAPS, createBasemapSource, type BasemapId } from "@/lib/basemaps";
import { createOverlayLayer } from "@/lib/overlayLayer";
import { buildIdentifyResult } from "@/data/identify";
import type { IdentifyResult } from "@/types";

import { Button } from "./ui/button";
import { SearchBox } from "./map/SearchBox";
import { NavControls } from "./map/NavControls";
import { ToolsColumn } from "./map/ToolsColumn";
import { StatusBar } from "./map/StatusBar";
import { BasemapSwitcher } from "./map/BasemapSwitcher";
import { LegendePanel } from "./map/LegendePanel";

const PIN_SVG = `<svg width="28" height="38" viewBox="0 0 28 38" xmlns="http://www.w3.org/2000/svg"><path d="M14 0C6.27 0 0 6.27 0 14c0 9.6 14 24 14 24s14-14.4 14-24C28 6.27 21.73 0 14 0z" fill="#00a0da"/><circle cx="14" cy="9.4" r="2.2" fill="#fff"/><rect x="12.1" y="12.8" width="3.8" height="9.8" rx="1.9" fill="#fff"/></svg>`;

interface MapViewProps {
  basemapId: BasemapId;
  onChangeBasemap: (id: BasemapId) => void;
  overlayVisible: boolean;
  overlayOpacity: number;
  pinCoordinate: Coordinate | null;
  onIdentify: (result: IdentifyResult) => void;
  leftPanelOpen: boolean;
  onOpenLeftPanel: () => void;
}

export function MapView({
  basemapId,
  onChangeBasemap,
  overlayVisible,
  overlayOpacity,
  pinCoordinate,
  onIdentify,
  leftPanelOpen,
  onOpenLeftPanel,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const basemapLayerRef = useRef<TileLayer<WMTS> | null>(null);
  const overlayLayerRef = useRef<ReturnType<typeof createOverlayLayer> | null>(
    null,
  );
  const pinOverlayRef = useRef<Overlay | null>(null);
  const onIdentifyRef = useRef(onIdentify);
  onIdentifyRef.current = onIdentify;

  const [map, setMap] = useState<Map | null>(null);
  const [pointer, setPointer] = useState<Coordinate | null>(null);
  const [scale, setScale] = useState(INITIAL_SCALE);
  const [resolution, setResolution] = useState(scaleToResolution(INITIAL_SCALE));

  // Create the map exactly once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const basemapLayer = new TileLayer({
      source: createBasemapSource(
        BASEMAPS.find((b) => b.id === basemapId) ?? BASEMAPS[0],
      ),
      preload: 2,
    });
    const overlay = createOverlayLayer();
    overlay.setVisible(overlayVisible);
    overlay.setOpacity(overlayOpacity);

    const view = new View({
      projection: SWISS_PROJECTION,
      center: INITIAL_CENTER,
      resolution: scaleToResolution(INITIAL_SCALE),
      constrainResolution: false,
      minResolution: 0.05,
      maxResolution: 500,
    });

    const olMap = new Map({
      target: containerRef.current,
      layers: [basemapLayer, overlay],
      view,
      controls: [],
    });

    const pinEl = document.createElement("div");
    pinEl.className = "zh-pin";
    pinEl.innerHTML = PIN_SVG;
    const pinOverlay = new Overlay({
      element: pinEl,
      positioning: "bottom-center",
      offset: [0, 0],
      stopEvent: false,
    });
    olMap.addOverlay(pinOverlay);

    olMap.on("pointermove", (e) => {
      if (e.dragging) return;
      setPointer(e.coordinate);
    });

    const updateScale = () => {
      const res = view.getResolution();
      if (res == null) return;
      setResolution(res);
      setScale(resolutionToScale(res));
    };
    olMap.on("moveend", updateScale);

    olMap.on("singleclick", (e) => {
      let hit = false;
      olMap.forEachFeatureAtPixel(
        e.pixel,
        () => {
          hit = true;
          return true;
        },
        { layerFilter: (l) => l === overlay },
      );
      onIdentifyRef.current(buildIdentifyResult(e.coordinate, hit));
    });

    // Pointer cursor over identifiable features.
    olMap.on("pointermove", (e) => {
      if (e.dragging) return;
      const hit = olMap.hasFeatureAtPixel(e.pixel, {
        layerFilter: (l) => l === overlay,
      });
      const target = olMap.getTargetElement();
      if (target) target.style.cursor = hit ? "pointer" : "";
    });

    basemapLayerRef.current = basemapLayer;
    overlayLayerRef.current = overlay;
    pinOverlayRef.current = pinOverlay;
    mapRef.current = olMap;
    setMap(olMap);
    updateScale();

    const ro = new ResizeObserver(() => olMap.updateSize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      olMap.setTarget(undefined);
      mapRef.current = null;
      setMap(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const def = BASEMAPS.find((b) => b.id === basemapId);
    if (basemapLayerRef.current && def)
      basemapLayerRef.current.setSource(createBasemapSource(def));
  }, [basemapId]);

  useEffect(() => {
    overlayLayerRef.current?.setVisible(overlayVisible);
  }, [overlayVisible]);

  useEffect(() => {
    overlayLayerRef.current?.setOpacity(overlayOpacity);
  }, [overlayOpacity]);

  useEffect(() => {
    pinOverlayRef.current?.setPosition(pinCoordinate ?? undefined);
  }, [pinCoordinate]);

  const attribution =
    BASEMAPS.find((b) => b.id === basemapId)?.attribution ?? "";

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#eceae2]">
      <div ref={containerRef} className="absolute inset-0" />

      <MapContext.Provider value={map}>
        {/* top-left: open-panel button (when closed) + Legende */}
        <div className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-2">
          {!leftPanelOpen && (
            <Button
              variant="zh"
              className="pointer-events-auto h-10 gap-2 shadow-md"
              onClick={onOpenLeftPanel}
            >
              <PanelLeftOpen className="size-4" />
              Karten
            </Button>
          )}
          <LegendePanel />
        </div>

        {/* top-right: search */}
        <div className="pointer-events-none absolute right-3 top-3 z-10 flex w-[min(640px,calc(100%-9rem))] justify-end">
          <SearchBox />
        </div>

        {/* right edge: tool column */}
        <div className="absolute right-3 top-[5.5rem] z-10">
          <ToolsColumn />
        </div>

        {/* bottom-right: basemap switcher + navigation */}
        <div className="absolute bottom-12 right-3 z-10 flex flex-col items-end gap-2">
          <BasemapSwitcher basemapId={basemapId} onChange={onChangeBasemap} />
          <NavControls />
        </div>

        {/* bottom: status bar */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10">
          <StatusBar
            coordinate={pointer}
            scale={scale}
            resolution={resolution}
            attribution={attribution}
          />
        </div>
      </MapContext.Provider>
    </div>
  );
}
