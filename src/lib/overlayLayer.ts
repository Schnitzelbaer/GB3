import Feature from "ol/Feature";
import Polygon from "ol/geom/Polygon";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Fill, Stroke, Style } from "ol/style";
import type { FeatureLike } from "ol/Feature";

type OverlayKind = "magenta" | "orange" | "green";

interface OverlayDef {
  kind: OverlayKind;
  ring: number[][];
}

// A scatter of illustrative "Pflegeplan Naturschutz" parcels around the
// initial view (LV95 / EPSG:2056), shaped to resemble the live viewer. The
// parcel covering the centre lets a click land an identify result.
const OVERLAY_DEFS: OverlayDef[] = [
  {
    kind: "magenta",
    ring: [
      [2681870, 1244900],
      [2682030, 1244888],
      [2682048, 1245028],
      [2681884, 1245044],
    ],
  },
  {
    kind: "orange",
    ring: [
      [2681700, 1245050],
      [2681792, 1245034],
      [2681810, 1245122],
      [2681712, 1245138],
    ],
  },
  {
    kind: "green",
    ring: [
      [2682060, 1244878],
      [2682150, 1244864],
      [2682162, 1244956],
      [2682068, 1244972],
    ],
  },
  {
    kind: "magenta",
    ring: [
      [2682185, 1245085],
      [2682288, 1245062],
      [2682308, 1245168],
      [2682205, 1245190],
    ],
  },
  {
    kind: "magenta",
    ring: [
      [2681612, 1244778],
      [2681724, 1244758],
      [2681744, 1244852],
      [2681636, 1244872],
    ],
  },
  {
    kind: "orange",
    ring: [
      [2682030, 1245185],
      [2682112, 1245168],
      [2682128, 1245252],
      [2682044, 1245268],
    ],
  },
  {
    kind: "magenta",
    ring: [
      [2681500, 1245180],
      [2681592, 1245164],
      [2681608, 1245252],
      [2681514, 1245268],
    ],
  },
  {
    kind: "green",
    ring: [
      [2681980, 1244716],
      [2682064, 1244702],
      [2682078, 1244782],
      [2681994, 1244798],
    ],
  },
];

const STYLES: Record<OverlayKind, Style> = {
  magenta: new Style({
    fill: new Fill({ color: "rgba(201, 64, 178, 0.38)" }),
    stroke: new Stroke({ color: "rgba(140, 24, 120, 0.95)", width: 1.5 }),
  }),
  orange: new Style({
    fill: new Fill({ color: "rgba(243, 146, 55, 0.42)" }),
    stroke: new Stroke({ color: "rgba(196, 96, 16, 0.95)", width: 1.5 }),
  }),
  green: new Style({
    fill: new Fill({ color: "rgba(120, 190, 90, 0.42)" }),
    stroke: new Stroke({ color: "rgba(70, 130, 50, 0.95)", width: 1.5 }),
  }),
};

export const OVERLAY_LAYER_ID = "pflegeplan-overlay";

export function createOverlayLayer() {
  const source = new VectorSource({
    features: OVERLAY_DEFS.map((def) => {
      const feature = new Feature({ geometry: new Polygon([def.ring]) });
      feature.set("kind", def.kind);
      return feature;
    }),
  });

  const layer = new VectorLayer({
    source,
    style: (feature: FeatureLike) =>
      STYLES[(feature.get("kind") as OverlayKind) ?? "magenta"],
  });
  layer.set("id", OVERLAY_LAYER_ID);
  return layer;
}
