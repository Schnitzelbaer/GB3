import { useCallback, useState } from "react";
import type { Coordinate } from "ol/coordinate";

import { Header } from "./components/Header";
import { LeftPanel } from "./components/LeftPanel";
import { MapView } from "./components/MapView";
import { InfoPanel } from "./components/InfoPanel";
import { ResizeHandle } from "./components/ResizeHandle";
import { CATALOG, HERO_LAYER_ID, HERO_LAYER_TITLE } from "./data/catalog";
import type { ActiveLayer, IdentifyResult } from "./types";
import type { BasemapId } from "./lib/basemaps";

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

export default function App() {
  const [leftOpen, setLeftOpen] = useState(true);
  const [leftWidth, setLeftWidth] = useState(330);
  const [infoWidth, setInfoWidth] = useState(400);
  const [basemapId, setBasemapId] = useState<BasemapId>("grau");
  const [info, setInfo] = useState<IdentifyResult | null>(null);
  const [activeLayers, setActiveLayers] = useState<ActiveLayer[]>([
    { id: HERO_LAYER_ID, title: HERO_LAYER_TITLE, visible: true, opacity: 1 },
  ]);

  const hero = activeLayers.find((l) => l.id === HERO_LAYER_ID);
  const overlayVisible = !!hero?.visible;
  const overlayOpacity = hero?.opacity ?? 1;
  const pinCoordinate: Coordinate | null = info ? info.coordinate : null;

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
            pinCoordinate={pinCoordinate}
            onIdentify={setInfo}
            leftPanelOpen={leftOpen}
            onOpenLeftPanel={() => setLeftOpen(true)}
          />
        </div>

        {info && (
          <>
            <ResizeHandle
              onResize={(x) =>
                setInfoWidth(clamp(window.innerWidth - x, 340, 760))
              }
            />
            <div className="shrink-0" style={{ width: infoWidth }}>
              <InfoPanel result={info} onClose={() => setInfo(null)} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
