import { createContext, useContext } from "react";
import type Map from "ol/Map";

export const MapContext = createContext<Map | null>(null);

export function useMapInstance(): Map | null {
  return useContext(MapContext);
}

// Full extent of the Canton of Zürich (LV95) — used by the "home" reset.
export const CANTON_EXTENT: [number, number, number, number] = [
  2669000, 1223500, 2718000, 1284000,
];
