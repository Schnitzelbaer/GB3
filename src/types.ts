import type { Coordinate } from "ol/coordinate";

export interface CatalogMap {
  id: string;
  title: string;
}

export interface CatalogTheme {
  id: string;
  title: string;
  maps: CatalogMap[];
}

export interface ActiveLayer {
  id: string;
  title: string;
  visible: boolean;
  /** 0..1 */
  opacity: number;
}

export interface IdentifyAttribute {
  label: string;
  value: string;
}

/* ----------------------------------------------------------------------- *
 * Info-Abfrage (info query) — tab + mode driven identify
 * ----------------------------------------------------------------------- */

/** What is being asked of the hit features. */
export type QueryTab = "features" | "statistik" | "datasets";

/** How / where the query is run on the map. */
export type QueryMode = "punkt" | "raster" | "umkreis" | "polygon" | "gemeinde";

/** The geometry produced by a map click in a given mode. */
export type QueryGeometry =
  | { kind: "punkt"; center: Coordinate }
  | { kind: "umkreis"; center: Coordinate; radiusM: number }
  | { kind: "raster"; center: Coordinate; cells: number; cellSize: number }
  | { kind: "polygon"; center: Coordinate; ring: Coordinate[] }
  | { kind: "gemeinde"; center: Coordinate; name: string; ring: Coordinate[] };

/** A single hit feature with its attributes and a map-highlight ring. */
export interface IdentifyFeature {
  id: string;
  attributes: IdentifyAttribute[];
  /** Polygon ring (LV95) used to highlight the feature on the map. */
  highlight: Coordinate[];
}

export interface IdentifyLayer {
  id: string;
  title: string;
  features: IdentifyFeature[];
}

export interface IdentifyDataset {
  id: string;
  title: string;
  layers: IdentifyLayer[];
}

/** Result shown in the "Features" tab. */
export interface FeaturesResult {
  /** Center of the query (used for the coordinate readout in Punkt mode). */
  coordinate: Coordinate;
  /** terrain model height (m) */
  dtm: number;
  /** surface model height (m) */
  dom: number;
  datasets: IdentifyDataset[];
}

/** A catalog map that has features at the queried location ("Datasets" tab). */
export interface DatasetHit {
  id: string;
  title: string;
  themeTitle: string;
  hitCount: number;
}

/* ----------------------------- Statistik tab ---------------------------- */

/** Cell shading relative to the cantonal average. */
export type StatTone = "low" | "mid" | "high";

export interface StatCell {
  value: string;
  tone?: StatTone;
}

export interface StatRow {
  label: string;
  /** [100 m, 200 m, 400 m, Kt. ZH] */
  cells: StatCell[];
  unit: string;
  /** Render emphasised (totals). */
  strong?: boolean;
}

export interface StatSection {
  /** Optional sub-header (e.g. "Gebäude nach Gebäudealter"). */
  title?: string;
  rows: StatRow[];
}

export interface StatBlock {
  id: string;
  title: string;
  date: string;
  /** Column headers, e.g. ["100m", "200m", "400m", "Kt. ZH"]. */
  columns: string[];
  sections: StatSection[];
  /** Show the red/neutral/green legend (Gebäude block). */
  colorLegend?: boolean;
  definition?: string;
  source: string;
}

/** Central, persistent state of the info-query tool (single source of truth). */
export interface InfoQueryState {
  /** Info tool selected. Default true; only another tool deselects it. */
  active: boolean;
  /** Second column (Features/Statistik/Datasets icons) visible. */
  flyoutOpen: boolean;
  /** Info panel visible — only after the first map click. */
  panelOpen: boolean;
  /** Query kind (Features/Statistik/Datasets) — driven by panel tabs + flyout. */
  tab: QueryTab;
  mode: QueryMode;
  /** Mode to restore when an aborted polygon draw is cancelled with Escape. */
  prevMode: QueryMode;
  /** Umkreis radius in metres. */
  radiusM: number;
  /** Raster: number of cells per side (N×N), cell size fixed at 100 m. */
  gridCount: number;
  /** Geometry of the most recent query (drives the map drawing). */
  geometry: QueryGeometry | null;
  /** Currently highlighted feature id (the "Markieren" radio). */
  markedFeatureId: string | null;
}
