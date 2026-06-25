import { useCallback, useMemo, useState } from "react";
import type { Coordinate } from "ol/coordinate";

import { Header } from "./components/Header";
import { LeftPanel } from "./components/LeftPanel";
import { MapView } from "./components/MapView";
import { InfoPanel } from "./components/InfoPanel";
import { ResizeHandle } from "./components/ResizeHandle";
import { CATALOG, HERO_LAYER_ID, HERO_LAYER_TITLE } from "./data/catalog";
import { buildDatasetsResult, buildFeaturesResult } from "./data/infoQuery";
import { buildStatistik } from "./data/statistik";
import { findMunicipality } from "./lib/municipalities";
import type {
  ActiveLayer,
  InfoQueryState,
  QueryGeometry,
  QueryMode,
  QueryTab,
} from "./types";
import type { BasemapId } from "./lib/basemaps";

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

const INITIAL_QUERY: InfoQueryState = {
  active: true,
  flyoutOpen: false,
  panelOpen: false,
  tab: "features",
  mode: "punkt",
  prevMode: "punkt",
  radiusM: 500,
  includeClipped: true,
  geometry: null,
  markedFeatureId: null,
};

/**
 * Derive the geometry for a (non-polygon) mode around an existing centre, so
 * switching modes keeps the clicked point. Polygon is handled separately
 * because it needs to be drawn.
 */
function deriveGeometry(
  center: Coordinate,
  mode: QueryMode,
  radiusM: number,
): QueryGeometry | null {
  switch (mode) {
    case "punkt":
      return { kind: "punkt", center };
    case "umkreis":
      return { kind: "umkreis", center, radiusM };
    case "gemeinde": {
      const m = findMunicipality(center);
      return m
        ? { kind: "gemeinde", center, name: m.name, ring: m.ring }
        : { kind: "punkt", center };
    }
    case "polygon":
      return null;
  }
}

export default function App() {
  const [leftOpen, setLeftOpen] = useState(true);
  const [leftWidth, setLeftWidth] = useState(330);
  const [infoWidth, setInfoWidth] = useState(420);
  const [basemapId, setBasemapId] = useState<BasemapId>("grau");
  const [query, setQuery] = useState<InfoQueryState>(INITIAL_QUERY);
  const [stubTool, setStubTool] = useState<string | null>(null);
  const [activeLayers, setActiveLayers] = useState<ActiveLayer[]>([
    { id: HERO_LAYER_ID, title: HERO_LAYER_TITLE, visible: true, opacity: 1 },
  ]);

  const hero = activeLayers.find((l) => l.id === HERO_LAYER_ID);
  const overlayVisible = !!hero?.visible;
  const overlayOpacity = hero?.opacity ?? 1;
  const activeLayerIds = useMemo(
    () => new Set(activeLayers.map((l) => l.id)),
    [activeLayers],
  );

  /* ----------------------------- query results ---------------------------- */
  const features = useMemo(
    () =>
      query.geometry
        ? buildFeaturesResult(query.geometry, query.includeClipped)
        : null,
    [query.geometry, query.includeClipped],
  );
  const datasets = useMemo(
    () =>
      query.geometry
        ? buildDatasetsResult(query.geometry, query.includeClipped)
        : null,
    [query.geometry, query.includeClipped],
  );
  const statistik = useMemo(
    () =>
      query.geometry
        ? buildStatistik(query.geometry.center, query.includeClipped)
        : null,
    [query.geometry, query.includeClipped],
  );
  const markedHighlight = useMemo<Coordinate[] | null>(() => {
    if (!query.markedFeatureId || !features) return null;
    for (const ds of features.datasets)
      for (const layer of ds.layers) {
        const f = layer.features.find((ft) => ft.id === query.markedFeatureId);
        if (f) return f.highlight;
      }
    return null;
  }, [query.markedFeatureId, features]);

  /* ------------------------------- tools/query ---------------------------- */
  // Info tool cannot be deselected — only another tool turns it off.
  const activeTool = query.active ? "info" : stubTool;

  const handleSelectTool = useCallback((id: string) => {
    if (id === "info") {
      setStubTool(null);
      setQuery((q) => ({ ...q, active: true, flyoutOpen: true }));
    } else {
      setStubTool(id);
      setQuery((q) => ({
        ...q,
        active: false,
        flyoutOpen: false,
        panelOpen: false,
        geometry: null,
        markedFeatureId: null,
      }));
    }
  }, []);

  const selectArt = useCallback(
    (tab: QueryTab) => setQuery((q) => ({ ...q, tab, flyoutOpen: false })),
    [],
  );

  const runQuery = useCallback(
    (geometry: QueryGeometry) =>
      setQuery((q) => ({
        ...q,
        geometry,
        panelOpen: true,
        flyoutOpen: false,
        markedFeatureId: null,
      })),
    [],
  );
  const changeTab = useCallback(
    (tab: QueryTab) => setQuery((q) => ({ ...q, tab })),
    [],
  );
  const changeMode = useCallback(
    (mode: QueryMode) =>
      setQuery((q) => {
        if (mode === "polygon") {
          // Keep geometry (panel content persists); the map suppresses the old
          // pin/shape while the polygon is drawn. Escape restores prevMode.
          return {
            ...q,
            mode,
            prevMode: q.mode === "polygon" ? q.prevMode : q.mode,
            markedFeatureId: null,
          };
        }
        const center = q.geometry?.center;
        const geometry = center
          ? deriveGeometry(center, mode, q.radiusM)
          : q.geometry;
        return { ...q, mode, geometry, markedFeatureId: null };
      }),
    [],
  );
  const abortPolygon = useCallback(
    () =>
      setQuery((q) => (q.mode === "polygon" ? { ...q, mode: q.prevMode } : q)),
    [],
  );
  const changeRadius = useCallback(
    (radiusM: number) =>
      setQuery((q) => ({
        ...q,
        radiusM,
        geometry:
          q.geometry?.kind === "umkreis"
            ? { ...q.geometry, radiusM }
            : q.geometry,
      })),
    [],
  );
  const toggleClipped = useCallback(
    (includeClipped: boolean) =>
      setQuery((q) => ({ ...q, includeClipped })),
    [],
  );
  const setMarked = useCallback(
    (markedFeatureId: string | null) =>
      setQuery((q) => ({ ...q, markedFeatureId })),
    [],
  );
  const closeInfo = useCallback(
    () =>
      setQuery((q) => ({
        ...q,
        panelOpen: false,
        geometry: null,
        markedFeatureId: null,
      })),
    [],
  );

  /* ------------------------------ active layers --------------------------- */
  const addMap = useCallback(
    (id: string, title: string) =>
      setActiveLayers((prev) =>
        prev.some((l) => l.id === id)
          ? prev
          : [{ id, title, visible: true, opacity: 1 }, ...prev],
      ),
    [],
  );
  const removeLayer = useCallback(
    (id: string) => setActiveLayers((p) => p.filter((l) => l.id !== id)),
    [],
  );
  const clearActive = useCallback(() => setActiveLayers([]), []);
  const toggleVisible = useCallback(
    (id: string) =>
      setActiveLayers((p) =>
        p.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)),
      ),
    [],
  );
  const setOpacity = useCallback(
    (id: string, opacity: number) =>
      setActiveLayers((p) =>
        p.map((l) => (l.id === id ? { ...l, opacity } : l)),
      ),
    [],
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header />
      <div className="flex min-h-0 flex-1">
        {leftOpen && (
          <>
            <div className="shrink-0" style={{ width: leftWidth }}>
              <LeftPanel
                catalog={CATALOG}
                activeLayers={activeLayers}
                onAddMap={addMap}
                onRemoveLayer={removeLayer}
                onClearActive={clearActive}
                onToggleVisible={toggleVisible}
                onSetOpacity={setOpacity}
                onClose={() => setLeftOpen(false)}
              />
            </div>
            <ResizeHandle onResize={(x) => setLeftWidth(clamp(x, 260, 560))} />
          </>
        )}

        <div className="relative min-w-0 flex-1">
          <MapView
            basemapId={basemapId}
            onChangeBasemap={setBasemapId}
            overlayVisible={overlayVisible}
            overlayOpacity={overlayOpacity}
            query={query}
            onQuery={runQuery}
            onSelectArt={selectArt}
            onAbortPolygon={abortPolygon}
            markedHighlight={markedHighlight}
            activeTool={activeTool}
            onSelectTool={handleSelectTool}
            leftPanelOpen={leftOpen}
            onOpenLeftPanel={() => setLeftOpen(true)}
          />
        </div>

        {query.active && query.panelOpen && (
          <>
            <ResizeHandle
              onResize={(x) =>
                setInfoWidth(clamp(window.innerWidth - x, 360, 820))
              }
            />
            <div className="shrink-0" style={{ width: infoWidth }}>
              <InfoPanel
                query={query}
                features={features}
                datasets={datasets}
                statistik={statistik}
                activeLayerIds={activeLayerIds}
                onClose={closeInfo}
                onChangeTab={changeTab}
                onChangeMode={changeMode}
                onChangeRadius={changeRadius}
                onToggleClipped={toggleClipped}
                onSetMarked={setMarked}
                onAddMap={addMap}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
