import WMTS from "ol/source/WMTS";
import WMTSTileGrid from "ol/tilegrid/WMTS";
import {
  SWISS_PROJECTION,
  SWISS_RESOLUTIONS,
  SWISS_MATRIX_IDS,
  SWISS_TILEGRID_ORIGIN,
} from "./swissProjection";

export type BasemapId = "grau" | "farbe" | "luftbild";

export interface BasemapDef {
  id: BasemapId;
  label: string;
  /** swisstopo WMTS layer identifier */
  layer: string;
  format: "jpeg" | "png";
  attribution: string;
}

export const BASEMAPS: BasemapDef[] = [
  {
    id: "grau",
    label: "Hintergrundkarte (grau)",
    layer: "ch.swisstopo.pixelkarte-grau",
    format: "jpeg",
    attribution: "© swisstopo / Kanton Zürich",
  },
  {
    id: "farbe",
    label: "Landeskarte (farbig)",
    layer: "ch.swisstopo.pixelkarte-farbe",
    format: "jpeg",
    attribution: "© swisstopo / Kanton Zürich",
  },
  {
    id: "luftbild",
    label: "Luftbild (SWISSIMAGE)",
    layer: "ch.swisstopo.swissimage",
    format: "jpeg",
    attribution: "© swisstopo / Kanton Zürich",
  },
];

function createTileGrid() {
  return new WMTSTileGrid({
    origin: SWISS_TILEGRID_ORIGIN,
    resolutions: SWISS_RESOLUTIONS,
    matrixIds: SWISS_MATRIX_IDS,
  });
}

export function createBasemapSource(def: BasemapDef): WMTS {
  return new WMTS({
    url: `https://wmts.geo.admin.ch/1.0.0/${def.layer}/default/current/2056/{TileMatrix}/{TileCol}/{TileRow}.${def.format}`,
    layer: def.layer,
    matrixSet: "2056",
    format: `image/${def.format}`,
    projection: SWISS_PROJECTION,
    requestEncoding: "REST",
    tileGrid: createTileGrid(),
    style: "default",
    attributions: def.attribution,
    crossOrigin: "anonymous",
    wrapX: false,
  });
}
