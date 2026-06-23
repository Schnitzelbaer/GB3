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

export interface IdentifyRecord {
  index: number;
  total: number;
  attributes: IdentifyAttribute[];
}

export interface IdentifySection {
  id: string;
  title: string;
  kind: "map" | "layer";
  records: IdentifyRecord[];
}

export interface IdentifyResult {
  coordinate: Coordinate;
  /** terrain model height (m) */
  dtm: number;
  /** surface model height (m) */
  dom: number;
  sections: IdentifySection[];
}
