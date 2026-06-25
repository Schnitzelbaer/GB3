import type { Coordinate } from "ol/coordinate";

import { CATALOG } from "./catalog";
import type {
  DatasetHit,
  FeaturesResult,
  IdentifyAttribute,
  IdentifyDataset,
  IdentifyFeature,
  QueryGeometry,
} from "@/types";

/* --------------------------------- utils -------------------------------- */

const round2 = (n: number) => Math.round(n * 100) / 100;
const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/** Deterministic, plausible terrain/surface heights for the readout. */
export function pseudoHeight(coord: Coordinate): { dtm: number; dom: number } {
  const seed = Math.abs(Math.sin(coord[0] * 0.0013 + coord[1] * 0.0017));
  const dtm = 405 + seed * 70;
  const dom = dtm + 0.02 + seed * 5;
  return { dtm: round2(dtm), dom: round2(dom) };
}

/** Small deterministic PRNG so mock values are stable per location. */
function makeRng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}
function hashCoord([x, y]: Coordinate): number {
  return (Math.round(x) * 73856093) ^ (Math.round(y) * 19349663);
}
function pick<T>(r: () => number, arr: T[]): T {
  return arr[Math.floor(r() * arr.length)];
}
function int(r: () => number, min: number, max: number): number {
  return Math.floor(min + r() * (max - min + 1));
}

/* ---------------------- geometry → number of hits ----------------------- */

function polyArea(ring: Coordinate[]): number {
  let a = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return Math.abs(a) / 2;
}

/** Rough number of features a query area would surface. */
function baseCount(g: QueryGeometry): number {
  switch (g.kind) {
    case "punkt":
      return 1;
    case "umkreis":
      return clamp(Math.round(g.radiusM / 180), 1, 6);
    case "polygon":
      return clamp(Math.round(polyArea(g.ring) / 30000), 1, 8);
    case "gemeinde":
      return 5;
  }
}

/** A ~44 m square ring near the query centre, spread out per feature index. */
function highlightRing(center: Coordinate, i: number): Coordinate[] {
  const step = 60;
  const col = (i % 3) - 1;
  const row = Math.floor(i / 3);
  const cx = center[0] + col * step;
  const cy = center[1] + row * step;
  const h = 22;
  return [
    [cx - h, cy - h],
    [cx + h, cy - h],
    [cx + h, cy + h],
    [cx - h, cy + h],
    [cx - h, cy - h],
  ];
}

/* ----------------------------- dataset defs ----------------------------- */

interface LayerDef {
  id: string;
  title: string;
  countFactor: number;
  attrs: (r: () => number) => IdentifyAttribute[];
}
interface DatasetDef {
  id: string;
  title: string;
  layers: LayerDef[];
}

const YEARS = ["2021", "2022", "2023"];

/** A normal map layer that has no statistics-displayable data. Shown across
 * all tabs; the Statistik tab renders a placeholder for it. */
export const NO_STATS_LAYER = {
  id: "bauprojekte",
  title: "Laufende Bauprojekte",
};

const DATASET_DEFS: DatasetDef[] = [
  {
    id: "bevoelkerung",
    title: "Räumliche Bevölkerungsstatistik",
    layers: [
      {
        id: "ewz-hektar",
        title: "Bevölkerung pro Hektare",
        countFactor: 1,
        attrs: (r) => {
          const total = int(r, 40, 480);
          const frauen = int(r, 18, total - 12);
          const a1 = int(r, 5, Math.round(total * 0.25));
          const a3 = int(r, 5, Math.round(total * 0.22));
          return [
            { label: "Hektar-ID", value: `CH${int(r, 100000, 999999)}` },
            { label: "Einwohner total", value: `${total}` },
            { label: "Frauen", value: `${frauen}` },
            { label: "Männer", value: `${total - frauen}` },
            {
              label: "Privathaushalte",
              value: `${int(r, Math.round(total / 2.8), Math.round(total / 1.9))}`,
            },
            { label: "Alter 0–19", value: `${a1}` },
            { label: "Alter 20–64", value: `${total - a1 - a3}` },
            { label: "Alter 65+", value: `${a3}` },
            { label: "Erhebungsjahr", value: pick(r, YEARS) },
          ];
        },
      },
    ],
  },
  {
    id: "beschaeftigte",
    title: "Beschäftigtenstatistik (STATENT)",
    layers: [
      {
        id: "besch-hektar",
        title: "Arbeitsstätten & Beschäftigte",
        countFactor: 0.7,
        attrs: (r) => {
          const besch = int(r, 3, 950);
          return [
            { label: "Hektar-ID", value: `CH${int(r, 100000, 999999)}` },
            { label: "Beschäftigte total", value: `${besch}` },
            {
              label: "Vollzeitäquivalente",
              value: `${Math.round(besch * (0.6 + r() * 0.35))}`,
            },
            {
              label: "Arbeitsstätten",
              value: `${int(r, 1, Math.max(2, Math.round(besch / 12)))}`,
            },
            {
              label: "Dominanter Sektor",
              value: pick(r, [
                "3. Sektor (Dienstleistung)",
                "2. Sektor (Industrie)",
                "1. Sektor (Landwirtschaft)",
              ]),
            },
            {
              label: "NOGA-Abschnitt",
              value: pick(r, [
                "G – Handel",
                "C – Herstellung von Waren",
                "M – Freiberufl./wiss. Tätigkeiten",
                "Q – Gesundheits-/Sozialwesen",
                "I – Gastgewerbe / Beherbergung",
              ]),
            },
            { label: "Erhebungsjahr", value: pick(r, YEARS) },
          ];
        },
      },
    ],
  },
  {
    id: "gebaeude",
    title: "Gebäude- und Wohnungsstatistik (GWR)",
    layers: [
      {
        id: "gwr-gebaeude",
        title: "Gebäude",
        countFactor: 1.2,
        attrs: (r) => {
          const kat = pick(r, [
            "Einfamilienhaus",
            "Mehrfamilienhaus",
            "Wohngebäude mit Nebennutzung",
            "Gebäude ohne Wohnnutzung",
          ]);
          return [
            { label: "EGID", value: `${int(r, 1000000, 9999999)}` },
            { label: "Gebäudekategorie", value: kat },
            { label: "Baujahr", value: `${int(r, 1890, 2024)}` },
            {
              label: "Anzahl Wohnungen",
              value: `${kat === "Einfamilienhaus" ? 1 : int(r, 2, 42)}`,
            },
            { label: "Anzahl Stockwerke", value: `${int(r, 1, 8)}` },
            {
              label: "Energieträger Heizung",
              value: pick(r, [
                "Wärmepumpe",
                "Gas",
                "Öl",
                "Fernwärme",
                "Holz",
                "Elektrizität",
              ]),
            },
            { label: "Gebäudefläche", value: `${int(r, 90, 640)} m²` },
          ];
        },
      },
      {
        id: "gwr-wohnungen",
        title: "Wohnungen",
        countFactor: 1.7,
        attrs: (r) => {
          const zimmer = int(r, 1, 6);
          return [
            { label: "EWID", value: `${int(r, 1, 60)}` },
            { label: "Zimmerzahl", value: `${zimmer}` },
            { label: "Wohnungsfläche", value: `${int(r, 28, 30 * zimmer)} m²` },
            { label: "Stockwerk", value: pick(r, ["EG", "1. OG", "2. OG", "3. OG", "DG"]) },
            { label: "Kocheinrichtung", value: pick(r, ["vorhanden", "vorhanden", "keine"]) },
            { label: "Bewohnt", value: pick(r, ["ja", "ja", "nein"]) },
          ];
        },
      },
    ],
  },
  {
    id: NO_STATS_LAYER.id,
    title: NO_STATS_LAYER.title,
    layers: [
      {
        id: "bauprojekte-flaechen",
        title: "Bauprojekte",
        countFactor: 0.8,
        attrs: (r) => [
          {
            label: "Projekt-Nr.",
            value: `BP-${int(r, 2021, 2026)}-${int(r, 100, 999)}`,
          },
          {
            label: "Bezeichnung",
            value: pick(r, [
              "Neubau Mehrfamilienhaus",
              "Umbau / Sanierung",
              "Ersatzneubau",
              "Anbau",
              "Aufstockung",
            ]),
          },
          {
            label: "Status",
            value: pick(r, [
              "Baugesuch eingereicht",
              "Baubewilligung erteilt",
              "im Bau",
              "abgeschlossen",
            ]),
          },
          {
            label: "Bauherrschaft",
            value: pick(r, [
              "Privat",
              "Baugenossenschaft",
              "Stadt Zürich",
              "Immobilien AG",
            ]),
          },
          {
            label: "Eingabedatum",
            value: `${int(r, 1, 28)}.${int(r, 1, 12)}.${int(r, 2021, 2025)}`,
          },
        ],
      },
    ],
  },
];

/* ------------------------------- builders ------------------------------- */

/** Build the "Features" tab result for a query geometry. */
export function buildFeaturesResult(
  g: QueryGeometry,
  includeClipped = true,
): FeaturesResult {
  const center = g.center;
  const { dtm, dom } = pseudoHeight(center);
  // Excluding boundary-clipped features shrinks the captured set.
  const base = includeClipped
    ? baseCount(g)
    : Math.max(1, Math.round(baseCount(g) * 0.55));
  const root = hashCoord(center);

  const datasets: IdentifyDataset[] = DATASET_DEFS.map((def, di) => ({
    id: def.id,
    title: def.title,
    layers: def.layers.map((layer, li) => {
      const count = clamp(Math.round(base * layer.countFactor), 1, 9);
      const features: IdentifyFeature[] = Array.from({ length: count }, (_, i) => {
        const r = makeRng(root + di * 9173 + li * 311 + i * 17);
        return {
          id: `${def.id}.${layer.id}.${i}`,
          attributes: layer.attrs(r),
          highlight: highlightRing(center, i),
        };
      });
      return { id: `${def.id}.${layer.id}`, title: layer.title, features };
    }),
  }));

  return { coordinate: center, dtm, dom, datasets };
}

/* --------------------------- datasets tab ------------------------------- */

const FLAT_MAPS: DatasetHit[] = CATALOG.flatMap((t) =>
  t.maps.map((m) => ({
    id: m.id,
    title: m.title,
    themeTitle: t.title,
  })),
);

/** Build the "Datasets" tab result: catalog maps that have data here. */
export function buildDatasetsResult(
  g: QueryGeometry,
  includeClipped = true,
): DatasetHit[] {
  const r = makeRng(hashCoord(g.center));
  const base = includeClipped
    ? baseCount(g)
    : Math.max(1, Math.round(baseCount(g) * 0.55));
  const n = clamp(3 + Math.round(base * 1.2), 3, 9);

  // The "no statistics" layer always appears at the top.
  const out: DatasetHit[] = [
    {
      id: NO_STATS_LAYER.id,
      title: NO_STATS_LAYER.title,
      themeTitle: "Bauten",
    },
  ];
  const pool = [...FLAT_MAPS];
  for (let k = 0; k < n && pool.length > 0; k++) {
    const idx = Math.floor(r() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}
