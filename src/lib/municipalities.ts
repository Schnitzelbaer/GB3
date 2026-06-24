import type { Coordinate } from "ol/coordinate";

export interface Municipality {
  name: string;
  bfs: number;
  ring: Coordinate[];
}

/**
 * Mock municipality boundaries — a simple grid of named cells tiling the area
 * around the initial view (LV95). Not geographically exact; enough so a click
 * reliably lands inside one cell for the "Gemeinde" query mode.
 */
function rect(x0: number, y0: number, x1: number, y1: number): Coordinate[] {
  return [
    [x0, y0],
    [x1, y0],
    [x1, y1],
    [x0, y1],
    [x0, y0],
  ];
}

const COLS = [2674000, 2679300, 2684600, 2690000];
const ROWS = [1238000, 1244000, 1250000];

// [row][col] — row 0 = south, row 1 = north.
const NAMES: { name: string; bfs: number }[][] = [
  [
    { name: "Stallikon", bfs: 13 },
    { name: "Adliswil", bfs: 131 },
    { name: "Kilchberg (ZH)", bfs: 135 },
  ],
  [
    { name: "Uitikon", bfs: 247 },
    { name: "Zürich", bfs: 261 },
    { name: "Zollikon", bfs: 161 },
  ],
];

export const MOCK_MUNICIPALITIES: Municipality[] = ROWS.slice(0, -1).flatMap(
  (y0, row) =>
    COLS.slice(0, -1).map((x0, col) => ({
      name: NAMES[row][col].name,
      bfs: NAMES[row][col].bfs,
      ring: rect(x0, y0, COLS[col + 1], ROWS[row + 1]),
    })),
);

/** Find the mock municipality whose cell contains the coordinate. */
export function findMunicipality([x, y]: Coordinate): Municipality | null {
  return (
    MOCK_MUNICIPALITIES.find(
      (m) =>
        x >= m.ring[0][0] &&
        x <= m.ring[1][0] &&
        y >= m.ring[0][1] &&
        y <= m.ring[2][1],
    ) ?? null
  );
}
