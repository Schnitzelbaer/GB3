import type { Coordinate } from "ol/coordinate";

import { NO_STATS_LAYER } from "./infoQuery";
import type { StatBlock, StatCell, StatRow } from "@/types";

/** Column headers of every statistic table. */
export const STAT_COLUMNS = ["Summe", "Median", "Durchschnitt", "Min", "Max"];

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

function median(sorted: number[]): number {
  const n = sorted.length;
  return n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
}

/** A mock sample of `n` values used to derive the aggregates. */
function sample(r: () => number, n: number, min: number, max: number): number[] {
  return Array.from({ length: n }, () => rint(r, min, max));
}

/** [Summe, Median, Durchschnitt, Min, Max] from a sample, formatted. */
function aggregates(values: number[], decimals = 0): StatCell[] {
  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;
  const fmt = decimals ? dec1 : grp;
  return [sum, median(sorted), mean, sorted[0], sorted[sorted.length - 1]].map(
    (v) => ({ value: fmt(v) }),
  );
}

function row(label: string, values: number[], decimals = 0): StatRow {
  return { label, cells: aggregates(values, decimals) };
}

/* ------------------------------- builder -------------------------------- */

/** Build the statistic blocks for the queried location (mock). */
export function buildStatistik(center: Coordinate): StatBlock[] {
  const r = makeRng(hashCoord(center));
  const n = () => rint(r, 9, 15); // sample size per metric

  const bevoelkerung: StatBlock = {
    id: "bevoelkerung",
    title: "Bevölkerungsstruktur",
    rows: [
      row("Bevölkerung (Pers.)", sample(r, n(), 8, 240)),
      row("Haushalte (Anzahl)", sample(r, n(), 3, 110)),
      row("Fläche (ha)", sample(r, n(), 1, 16)),
    ],
    source: "Statistisches Amt Kanton Zürich, Einwohnerregister (EWR).",
  };

  const beschaeftigung: StatBlock = {
    id: "beschaeftigung",
    title: "Beschäftigungsstruktur",
    rows: [
      row("Betriebe (Anzahl)", sample(r, n(), 1, 60)),
      row("Beschäftigte (Personen)", sample(r, n(), 2, 520)),
      row("Vollzeitäquivalente (VZÄ)", sample(r, n(), 1, 460), 1),
    ],
    definition:
      "VZÄ: Vollzeitäquivalente ergeben sich aus der Umrechnung von ganz- oder " +
      "teilzeitlich Beschäftigten auf Vollzeitstellen.",
    source:
      "Bundesamt für Statistik, Statistik der Unternehmensstruktur (STATENT) provisorisch.",
  };

  const gebaeude: StatBlock = {
    id: "gebaeude",
    title: "Gebäudestruktur",
    rows: [
      row("Gebäude (Anzahl)", sample(r, n(), 1, 60)),
      row("Wohnungen (Anzahl)", sample(r, n(), 1, 220)),
      row("Wohnfläche pro Wohnung (qm)", sample(r, n(), 38, 160), 1),
    ],
    source: "Statistisches Amt Kanton Zürich, Gebäude- und Wohnungsregister (GWR).",
  };

  const bauprojekte: StatBlock = {
    id: NO_STATS_LAYER.id,
    title: NO_STATS_LAYER.title,
    rows: [],
    placeholder: true,
  };

  return [bevoelkerung, beschaeftigung, gebaeude, bauprojekte];
}
