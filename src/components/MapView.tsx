import { useEffect, useRef, useState } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import Polygon from "ol/geom/Polygon";
import CircleGeom from "ol/geom/Circle";
import Draw from "ol/interaction/Draw";
import Overlay from "ol/Overlay";
import { Fill, Stroke, Style } from "ol/style";
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
import { findMunicipality } from "@/lib/municipalities";
import type { InfoQueryState, QueryGeometry, QueryTab } from "@/types";

import { Button } from "./ui/button";
import { SearchBox } from "./map/SearchBox";
import { NavControls } from "./map/NavControls";
import { ToolsColumn } from "./map/ToolsColumn";
import { InfoArtFlyout } from "./map/InfoArtFlyout";
import { StatusBar } from "./map/StatusBar";
import { BasemapSwitcher } from "./map/BasemapSwitcher";
import { LegendePanel } from "./map/LegendePanel";

const PIN_SVG = `<svg width="28" height="38" viewBox="0 0 28 38" xmlns="http://www.w3.org/2000/svg"><path d="M14 0C6.27 0 0 6.27 0 14c0 9.6 14 24 14 24s14-14.4 14-24C28 6.27 21.73 0 14 0z" fill="#00a0da"/><circle cx="14" cy="9.4" r="2.2" fill="#fff"/><rect x="12.1" y="12.8" width="3.8" height="9.8" rx="1.9" fill="#fff"/></svg>`;

const GEOM_STYLE = new Style({
  stroke: new Stroke({ color: "#00407C", width: 2 }),
  fill: new Fill({ color: "rgba(0,64,124,0.12)" }),
});
const HIGHLIGHT_STYLE = new Style({
  stroke: new Stroke({ color: "#ffcc00", width: 3 }),
  fill: new Fill({ color: "rgba(255,204,0,0.35)" }),
});

function centroid(ring: Coordinate[]): Coordinate {
  // ring is closed (last === first); average the distinct vertices.
  const pts = ring.slice(0, -1);
  const sum = pts.reduce((a, [x, y]) => [a[0] + x, a[1] + y], [0, 0]);
  return [sum[0] / pts.length, sum[1] / pts.length];
}

/** Build OL features that visualise a query geometry. */
function geometryFeatures(g: QueryGeometry): Feature[] {
  switch (g.kind) {
    case "punkt":
      return [];
    case "umkreis":
      return [new Feature(new CircleGeom(g.center, g.radiusM))];
    case "polygon":
    case "gemeinde":
      return [new Feature(new Polygon([g.ring]))];
  }
}

interface MapViewProps {
  basemapId: BasemapId;
  onChangeBasemap: (id: BasemapId) => void;
  overlayVisible: boolean;
  overlayOpacity: number;
  query: InfoQueryState;
  onQuery: (geometry: QueryGeometry) => void;
  onSelectArt: (tab: QueryTab) => void;
  onAbortPolygon: () => void;
  markedHighlight: Coordinate[] | null;
  activeTool: string | null;
  onSelectTool: (id: string) => void;
  leftPanelOpen: boolean;
  onOpenLeftPanel: () => void;
}

export function MapView({
  basemapId,
  onChangeBasemap,
  overlayVisible,
  overlayOpacity,
  query,
  onQuery,
  onSelectArt,
  onAbortPolygon,
  markedHighlight,
  activeTool,
  onSelectTool,
  leftPanelOpen,
  onOpenLeftPanel,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const basemapLayerRef = useRef<TileLayer<WMTS> | null>(null);
  const overlayLayerRef = useRef<ReturnType<typeof createOverlayLayer> | null>(
    null,
  );
  const geomSourceRef = useRef<VectorSource | null>(null);
  const highlightSourceRef = useRef<VectorSource | null>(null);
  const pinOverlayRef = useRef<Overlay | null>(null);
  const drawRef = useRef<Draw | null>(null);

  const queryRef = useRef(query);
  queryRef.current = query;
  const onQueryRef = useRef(onQuery);
  onQueryRef.current = onQuery;
  const onAbortPolygonRef = useRef(onAbortPolygon);
  onAbortPolygonRef.current = onAbortPolygon;

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

    const geomSource = new VectorSource();
    const geomLayer = new VectorLayer({ source: geomSource, style: GEOM_STYLE });
    const highlightSource = new VectorSource();
    const highlightLayer = new VectorLayer({
      source: highlightSource,
      style: HIGHLIGHT_STYLE,
    });

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
      layers: [basemapLayer, overlay, geomLayer, highlightLayer],
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

    // Mode-aware identify. Polygon mode is handled by the Draw interaction.
    olMap.on("singleclick", (e) => {
      const q = queryRef.current;
      if (!q.active || q.mode === "polygon") return;
      const center = e.coordinate;
      let geometry: QueryGeometry | null = null;
      switch (q.mode) {
        case "punkt":
          geometry = { kind: "punkt", center };
          break;
        case "umkreis":
          geometry = { kind: "umkreis", center, radiusM: q.radiusM };
          break;
        case "gemeinde": {
          const muni = findMunicipality(center);
          if (!muni) return;
          geometry = {
            kind: "gemeinde",
            center,
            name: muni.name,
            ring: muni.ring,
          };
          break;
        }
      }
      if (geometry) onQueryRef.current(geometry);
    });

    basemapLayerRef.current = basemapLayer;
    overlayLayerRef.current = overlay;
    geomSourceRef.current = geomSource;
    highlightSourceRef.current = highlightSource;
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

  // Draw the current query geometry + position the pin. While a polygon is
  // pending (mode is polygon but nothing drawn yet), suppress the old pin/shape.
  useEffect(() => {
    const src = geomSourceRef.current;
    if (!src) return;
    src.clear();
    const g = query.geometry;
    const polygonPending = query.mode === "polygon" && g?.kind !== "polygon";
    if (!g || polygonPending) {
      pinOverlayRef.current?.setPosition(undefined);
      return;
    }
    const features = geometryFeatures(g);
    if (features.length) src.addFeatures(features);
    pinOverlayRef.current?.setPosition(g.center);
  }, [query.geometry, query.mode]);

  // Highlight the marked feature.
  useEffect(() => {
    const src = highlightSourceRef.current;
    if (!src) return;
    src.clear();
    if (markedHighlight)
      src.addFeature(new Feature(new Polygon([markedHighlight])));
  }, [markedHighlight]);

  // Polygon-draw interaction, active only in polygon mode while the tool is on.
  // Escape aborts the sketch; if the polygon is still pending (just switched to
  // polygon, nothing committed), it reverts to the previously active mode.
  useEffect(() => {
    if (!map) return;
    if (!(query.active && query.mode === "polygon")) return;

    const drawSource = new VectorSource();
    const draw = new Draw({ source: drawSource, type: "Polygon" });
    draw.on("drawend", (e) => {
      const geom = e.feature.getGeometry();
      if (!(geom instanceof Polygon)) return;
      const ring = geom.getCoordinates()[0] as Coordinate[];
      onQueryRef.current({ kind: "polygon", center: centroid(ring), ring });
      // The visible polygon is rendered from query state; drop the sketch.
      window.setTimeout(() => drawSource.clear(), 0);
    });
    map.addInteraction(draw);
    drawRef.current = draw;

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key !== "Escape") return;
      draw.abortDrawing();
      const q = queryRef.current;
      // Only revert when nothing has been committed yet (polygon pending).
      if (q.mode === "polygon" && q.geometry?.kind !== "polygon")
        onAbortPolygonRef.current();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      map.removeInteraction(draw);
      drawRef.current = null;
    };
  }, [map, query.active, query.mode]);

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

        {/* right edge: Abfrage-Art flyout (left) + tool column */}
        <div className="absolute right-3 top-[5.5rem] z-10 flex items-start gap-2">
          {query.flyoutOpen && (
            <InfoArtFlyout tab={query.tab} onSelect={onSelectArt} />
          )}
          <ToolsColumn
            activeTool={activeTool}
            onSelectTool={onSelectTool}
            infoTab={query.tab}
          />
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
