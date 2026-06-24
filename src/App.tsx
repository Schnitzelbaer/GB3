import { useCallback, useMemo, useState } from "react";
import type { Coordinate } from "ol/coordinate";

import { Header } from "./components/Header";
import { LeftPanel } from "./components/LeftPanel";
import { MapView } from "./components/MapView";
import { InfoPanel } from "./components/InfoPanel";
import { ResizeHandle } from "./components/ResizeHandle";
import { CATALOG, HERO_LAYER_ID, HERO_LAYER_TITLE } from "./data/catalog";
import { buildDatasetsResult, buildFeaturesResult } from "./data/infoQuery";
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
  open: true,
  tab: "features",
  mode: "punkt",
  radiusM: 500,
  gridCount: 3,
  geometry: null,
  markedFeatureId: null,
};

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
    () => (query.geometry ? buildFeaturesResult(query.geometry) : null),
    [query.geometry],
  );
  const datasets = useMemo(
    () => (query.geometry ? buildDatasetsResult(query.geometry) : null),
    [query.geometry],
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
  const activeTool = query.open ? "info" : stubTool;

  const handleSelectTool = useCallback((id: string) => {
    if (id === "info") {
      setStubTool(null);
      setQuery((q) =>
        q.open
          ? { ...q, open: false, geometry: null, markedFeatureId: null }
          : { ...q, open: true },
      );
    } else {
      setStubTool((t) => (t === id ? null : id));
      setQuery((q) => ({ ...q, open: false, geometry: null, markedFeatureId: null }));
    }
  }, []);

  const runQuery = useCallback(
    (geometry: QueryGeometry) =>
      setQuery((q) => ({ ...q, geometry, markedFeatureId: null })),
    [],
  );
  const changeTab = useCallback(
    (tab: QueryTab) => setQuery((q) => ({ ...q, tab })),
    [],
  );
  const changeMode = useCallback(
    (mode: QueryMode) =>
      setQuery((q) => ({ ...q, mode, geometry: null, markedFeatureId: null })),
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
  const changeGrid = useCallback(
    (gridCount: number) =>
      setQuery((q) => ({
        ...q,
        gridCount,
        geometry:
          q.geometry?.kind === "raster"
            ? { ...q.geometry, cells: gridCount }
            : q.geometry,
      })),
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
        open: false,
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
            markedHighlight={markedHighlight}
            activeTool={activeTool}
            onSelectTool={handleSelectTool}
            leftPanelOpen={leftOpen}
            onOpenLeftPanel={() => setLeftOpen(true)}
          />
        </div>

        {query.open && (
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
                activeLayerIds={activeLayerIds}
                onClose={closeInfo}
                onChangeTab={changeTab}
                onChangeMode={changeMode}
                onChangeRadius={changeRadius}
                onChangeGrid={changeGrid}
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
