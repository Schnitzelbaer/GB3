import proj4 from "proj4";
import { register } from "ol/proj/proj4";
import { get as getProjection, transform } from "ol/proj";
import type { Coordinate } from "ol/coordinate";

// Swiss LV95 (EPSG:2056) and legacy LV03 (EPSG:21781) definitions.
proj4.defs(
  "EPSG:2056",
  "+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 " +
    "+k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel " +
    "+towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs",
);
proj4.defs(
  "EPSG:21781",
  "+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 " +
    "+k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel " +
    "+towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs",
);
register(proj4);

export const SWISS_PROJECTION = getProjection("EPSG:2056")!;
// Full LV95 extent of Switzerland.
SWISS_PROJECTION.setExtent([2420000, 1030000, 2900000, 1350000]);

// swisstopo / geo.admin.ch WMTS resolution set for EPSG:2056.
export const SWISS_RESOLUTIONS = [
  4000, 3750, 3500, 3250, 3000, 2750, 2500, 2250, 2000, 1750, 1500, 1250, 1000,
  750, 650, 500, 250, 100, 50, 20, 10, 5, 2.5, 2, 1.5, 1, 0.5, 0.25, 0.1,
];
export const SWISS_MATRIX_IDS = SWISS_RESOLUTIONS.map((_, i) => `${i}`);
export const SWISS_TILEGRID_ORIGIN: Coordinate = [2420000, 1350000];

// Initial view: centre from the original viewer URL
// (?x=2681953&y=1244969); scale eased out to ~1:7000 so the landing view
// matches the reference layout and shows the parcels in context.
export const INITIAL_CENTER: Coordinate = [2681953, 1244969];
export const INITIAL_SCALE = 7000;

// OGC standard "standardized rendering pixel size" (0.28 mm).
const METERS_PER_PIXEL = 0.00028;

export function scaleToResolution(scale: number): number {
  return scale * METERS_PER_PIXEL;
}

export function resolutionToScale(resolution: number): number {
  return resolution / METERS_PER_PIXEL;
}

/** Format an LV95 easting/northing pair, e.g. "2 681 953 / 1 244 969". */
export function formatLv95([e, n]: Coordinate): string {
  return `${group(e)} / ${group(n)}`;
}

/** Format the legacy LV03 pair. */
export function formatLv03([e, n]: Coordinate): string {
  const lv03 = transform([e, n], "EPSG:2056", "EPSG:21781");
  return `${group(lv03[0])} / ${group(lv03[1])}`;
}

/** Format WGS84 lon/lat in decimal degrees, e.g. "8.5305° / 47.3577°". */
export function formatWgs84([e, n]: Coordinate): string {
  const [lon, lat] = transform([e, n], "EPSG:2056", "EPSG:4326");
  return `${lat.toFixed(5)}° N / ${lon.toFixed(5)}° E`;
}

function group(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
