import type { Coordinate } from "ol/coordinate";

import type {
  StatBlock,
  StatCell,
  StatRow,
  StatTone,
} from "@/types";

/* --------------------------------- utils -------------------------------- */

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
function rint(r: () => number, min: number, max: number): number {
  return Math.floor(min + r() * (max - min + 1));
}

/** Swiss thousands grouping with an apostrophe. */
function grp(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "’");
}
const dec1 = (n: number) => n.toFixed(1);

/** Tone of a cell vs. the cantonal value (±5 % band). */
function toneVs(value: number, cantonal: number): StatTone {
  if (value < cantonal * 0.95) return "low";
  if (value > cantonal * 1.05) return "high";
  return "mid";
}

/** A count row growing with cell size (100 m ⊂ 200 m ⊂ 400 m). */
function countRow(
  label: string,
  unit: string,
  base: number,
  r: () => number,
  cantonal: number,
  strong = false,
): StatRow {
  const c100 = base;
  const c200 = Math.round(c100 * (1.8 + r() * 0.8));
  const c400 = Math.round(c200 * (2.6 + r() * 1.0));
  return {
    label,
    unit,
    strong,
    cells: [c100, c200, c400, cantonal].map((v) => ({ value: grp(v) })),
  };
}

/** N percentages per column summing to 100, plus the cantonal column. */
function pctRows(
  defs: { label: string; cantonal: number }[],
  r: () => number,
  colored: boolean,
): StatRow[] {
  // For each of the three cell sizes, draw weights and normalise to 100.
  const cols: number[][] = [0, 1, 2].map(() => {
    const w = defs.map(() => 0.2 + r());
    const sum = w.reduce((a, b) => a + b, 0);
    const pct = w.map((x) => Math.round((x / sum) * 1000) / 10);
    // fix rounding drift on the last entry
    const drift = Math.round((100 - pct.reduce((a, b) => a + b, 0)) * 10) / 10;
    pct[pct.length - 1] = Math.round((pct[pct.length - 1] + drift) * 10) / 10;
    return pct;
  });
  return defs.map((d, i) => {
    const cells: StatCell[] = [0, 1, 2].map((c) => ({
      value: dec1(cols[c][i]),
      tone: colored ? toneVs(cols[c][i], d.cantonal) : undefined,
    }));
    cells.push({ value: dec1(d.cantonal) });
    return { label: d.label, unit: "%", cells };
  });
}

/* --------------------------- cantonal constants ------------------------- */
// Kt. ZH reference values taken from the source tables.

const KT = {
  bevoelkerung: 1643192,
  flaeche: 172889,
  dichte: 9.5,
  betriebe: 123989,
  beschaeftigte: 1223082,
  vza: 991605,
  gebaeudeTotal: 366894,
  wohnungen: 799738,
  wohnflaeche: 95.8,
};

const ALTER = [
  { label: "vor 1945", cantonal: 24.44 },
  { label: "1946 bis 1980", cantonal: 27.87 },
  { label: "1981 bis 2000", cantonal: 19.03 },
  { label: "nach 2000", cantonal: 20.36 },
  { label: "k.A.", cantonal: 8.3 },
];
const KATEGORIEN = [
  { label: "EFH", cantonal: 32.36 },
  { label: "MFH", cantonal: 20.53 },
  { label: "Mischnutzung", cantonal: 9.44 },
  { label: "übrige", cantonal: 37.66 },
];
const STOCKWERKE = [
  { label: "1 bis 2", cantonal: 28.8 },
  { label: "3 bis 4", cantonal: 31.7 },
  { label: "5 bis 6", cantonal: 7.3 },
  { label: "mehr als 7", cantonal: 2.9 },
  { label: "k.A.", cantonal: 29.4 },
];

/* ------------------------------- builder -------------------------------- */

/** Build the three statistic blocks for the queried location (mock). */
export function buildStatistik(center: Coordinate): StatBlock[] {
  const r = makeRng(hashCoord(center));
  const COLS = ["100m", "200m", "400m", "Kt. ZH"];

  // Bevölkerung — area per cell is fixed (1 / 4 / 16 ha); density is derived.
  const pop100 = rint(r, 90, 380);
  const pop200 = Math.round(pop100 * (1.7 + r() * 0.8));
  const pop400 = Math.round(pop200 * (2.6 + r() * 1.0));
  const flaeche = [1, 4, 16];
  const pops = [pop100, pop200, pop400];
  const bevoelkerung: StatBlock = {
    id: "bevoelkerung",
    title: "Bevölkerungsstruktur per Rasterzelle",
    date: "(31.12.2025)",
    columns: COLS,
    sections: [
      {
        rows: [
          {
            label: "Bevölkerung",
            unit: "Pers.",
            strong: true,
            cells: [...pops, KT.bevoelkerung].map((v) => ({ value: grp(v) })),
          },
          {
            label: "Fläche",
            unit: "ha",
            cells: [...flaeche, KT.flaeche].map((v) => ({ value: grp(v) })),
          },
          {
            label: "Dichte",
            unit: "Pers./ha",
            cells: [
              ...pops.map((p, i) => ({ value: grp(p / flaeche[i]) })),
              { value: dec1(KT.dichte) },
            ],
          },
        ],
      },
    ],
    source:
      "Statistisches Amt Kanton Zürich, Einwohnerregister (EWR). Achtung: die " +
      "Quartieranalyse und die räumliche Bevölkerungsstatistik verwenden " +
      "unterschiedliche Quellen; Dichte- und Bevölkerungszahlen können daher " +
      "leicht voneinander abweichen.",
  };

  // Beschäftigung
  const betriebe = rint(r, 8, 40);
  const besch = rint(r, 120, 420);
  const beschaeftigung: StatBlock = {
    id: "beschaeftigung",
    title: "Beschäftigungsstruktur in den Rasterzellen",
    date: "(31.12.2021)",
    columns: COLS,
    sections: [
      {
        rows: [
          countRow("Betriebe", "Betriebe", betriebe, r, KT.betriebe),
          countRow("Beschäftigte", "Personen", besch, r, KT.beschaeftigte),
          (() => {
            const row = countRow(
              "Vollzeitäquivalente",
              "VZÄ",
              Math.round(besch * (0.6 + r() * 0.3)),
              r,
              KT.vza,
            );
            // VZÄ are shown with one decimal in the source.
            row.cells = row.cells.map((c) => ({
              value: c.value.includes("’")
                ? c.value
                : dec1(Number(c.value)),
            }));
            return row;
          })(),
        ],
      },
    ],
    definition:
      "VZÄ: Vollzeitäquivalente (VZÄ) ergeben sich aus der Umrechnung von ganz- " +
      "oder teilzeitlich Beschäftigten auf Vollzeitstellen.",
    source:
      "Bundesamt für Statistik, Statistik der Unternehmensstruktur (STATENT) provisorisch",
  };

  // Gebäude
  const geb = rint(r, 8, 40);
  const wohnungen = Math.round(geb * (3 + r() * 6));
  const gebaeude: StatBlock = {
    id: "gebaeude",
    title: "Gebäudestruktur in den Rasterzellen",
    date: "(31.12.2025)",
    columns: COLS,
    colorLegend: true,
    sections: [
      {
        title: "Gebäude",
        rows: [
          countRow("Gebäude Total", "Anzahl", geb, r, KT.gebaeudeTotal, true),
        ],
      },
      { title: "Gebäude nach Gebäudealter", rows: pctRows(ALTER, r, false) },
      { title: "Gebäudekategorien", rows: pctRows(KATEGORIEN, r, true) },
      {
        title: "Gebäude nach Stockwerkzahl",
        rows: [
          ...pctRows(STOCKWERKE, r, true),
          countRow("Wohnungen", "Anzahl", wohnungen, r, KT.wohnungen),
          (() => {
            const v = [0, 1, 2].map(() => 68 + r() * 30);
            return {
              label: "Durchschn. Wohnfläche pro Wohnung",
              unit: "qm",
              cells: [
                ...v.map((x) => ({
                  value: dec1(x),
                  tone: toneVs(x, KT.wohnflaeche),
                })),
                { value: dec1(KT.wohnflaeche) },
              ],
            } as StatRow;
          })(),
        ],
      },
    ],
    definition:
      "Das Gebäude- und Wohnungsregister enthält sowohl Gebäude mit als auch " +
      "ohne Wohnnutzung.",
    source:
      "Statistisches Amt Kanton Zürich, Gebäude- und Wohnungsregister (GWR)",
  };

  return [bevoelkerung, beschaeftigung, gebaeude];
}
