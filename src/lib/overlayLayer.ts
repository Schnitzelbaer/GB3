import Feature from "ol/Feature";
import Polygon from "ol/geom/Polygon";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Fill, Stroke, Style } from "ol/style";

/**
 * The default "Aktive Karten" — the sample datasets shown by default. Each has
 * its own colour; a handful of illustrative parcels on the map belong to each
 * one (see OVERLAY_DEFS). IDs match the dataset ids used by the Info panel
 * (data/infoQuery.ts) so the active list and the query results stay coherent.
 */
export interface SampleMap {
  id: string;
  title: string;
  /** Base colour (hex) for the parcels + legend swatch. */
  color: string;
}

export const SAMPLE_MAPS: SampleMap[] = [
  { id: "bevoelkerung", title: "Räumliche Bevölkerungsstatistik", color: "#7c3aed" },
  { id: "beschaeftigte", title: "Beschäftigtenstatistik", color: "#ea580c" },
  { id: "gebaeude", title: "Gebäudestruktur", color: "#16a34a" },
  { id: "bauprojekte", title: "Laufende Bauprojekte", color: "#c026d3" },
];

interface OverlayDef {
  mapId: string;
  ring: number[][];
}

// Illustrative parcels around the initial view (LV95 / EPSG:2056), spread
// across the four sample maps (mapId).
const OVERLAY_DEFS: OverlayDef[] = [
  {
    mapId: "bevoelkerung",
    ring: [
      [2681870, 1244900],
      [2682030, 1244888],
      [2682048, 1245028],
      [2681884, 1245044],
    ],
  },
  {
    mapId: "beschaeftigte",
    ring: [
      [2681700, 1245050],
      [2681792, 1245034],
      [2681810, 1245122],
      [2681712, 1245138],
    ],
  },
  {
    mapId: "gebaeude",
    ring: [
      [2682060, 1244878],
      [2682150, 1244864],
      [2682162, 1244956],
      [2682068, 1244972],
    ],
  },
  {
    mapId: "bauprojekte",
    ring: [
      [2682185, 1245085],
      [2682288, 1245062],
      [2682308, 1245168],
      [2682205, 1245190],
    ],
  },
  {
    mapId: "bevoelkerung",
    ring: [
      [2681612, 1244778],
      [2681724, 1244758],
      [2681744, 1244852],
      [2681636, 1244872],
    ],
  },
  {
    mapId: "beschaeftigte",
    ring: [
      [2682030, 1245185],
      [2682112, 1245168],
      [2682128, 1245252],
      [2682044, 1245268],
    ],
  },
  {
    mapId: "gebaeude",
    ring: [
      [2681500, 1245180],
      [2681592, 1245164],
      [2681608, 1245252],
      [2681514, 1245268],
    ],
  },
  {
    mapId: "bauprojekte",
    ring: [
      [2681980, 1244716],
      [2682064, 1244702],
      [2682078, 1244782],
      [2681994, 1244798],
    ],
  },
];

/** hex "#rrggbb" → "rgba(r,g,b,a)". */
function withAlpha(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

/** One VectorLayer per sample map (visibility/opacity driven by App state). */
export function createSampleLayers(): { id: string; layer: VectorLayer }[] {
  return SAMPLE_MAPS.map((m) => {
    const features = OVERLAY_DEFS.filter((d) => d.mapId === m.id).map(
      (d) => new Feature({ geometry: new Polygon([d.ring]) }),
    );
    const layer = new VectorLayer({
      source: new VectorSource({ features }),
      style: new Style({
        fill: new Fill({ color: withAlpha(m.color, 0.4) }),
        stroke: new Stroke({ color: m.color, width: 1.5 }),
      }),
    });
    layer.set("id", m.id);
    return { id: m.id, layer };
  });
}
