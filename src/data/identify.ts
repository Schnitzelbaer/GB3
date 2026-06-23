import type { Coordinate } from "ol/coordinate";
import type { IdentifyResult, IdentifySection } from "@/types";

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/** Deterministic, plausible terrain/surface heights for the status readout. */
export function pseudoHeight(coord: Coordinate): { dtm: number; dom: number } {
  const seed = Math.abs(Math.sin(coord[0] * 0.0013 + coord[1] * 0.0017));
  const dtm = 405 + seed * 70;
  const dom = dtm + 0.02 + seed * 5;
  return { dtm: round2(dtm), dom: round2(dom) };
}

const PFLEGEPLAN_SECTIONS: IdentifySection[] = [
  {
    id: "pflegeplan",
    title: "1. Pflegeplan Naturschutz-Teilflächen: aktuelles Jahr",
    kind: "map",
    records: [],
  },
  {
    id: "kulturen",
    title: "Kulturen aktuelles Jahr",
    kind: "layer",
    records: [
      {
        index: 1,
        total: 1,
        attributes: [
          { label: "Betriebs-Nr.", value: "ZH0261/ 1/239" },
          { label: "Label", value: '98.43-NS34418 "Naturschutzfläche"' },
          { label: "GEO-ID", value: "317797" },
          { label: "Bewirtschaftungseinheit", value: "-" },
          {
            label: "Kultur",
            value: "0611 - Extensiv genutzte Wiesen (ohne Weiden)",
          },
          { label: "Bewirtschaftungs-Nr.", value: "261.WO6654.0" },
          { label: "Schnittzeitpunkt", value: "gem. Pflegeplan" },
          { label: "Landwirtschaftliche Nutzfläche", value: "31" },
          { label: "QI", value: "1" },
          { label: "QII", value: "0" },
          { label: "Vernetzung", value: "0" },
          { label: "NHG", value: "1" },
        ],
      },
    ],
  },
  {
    id: "massnahme",
    title: "Massnahme Ebene 1 aktuelles Jahr",
    kind: "layer",
    records: [
      {
        index: 1,
        total: 1,
        attributes: [
          { label: "KEY", value: "G310" },
          { label: "Pflege", value: "1 Schnitt pro Jahr ab 15.7." },
          { label: "Bemerkung", value: "-" },
        ],
      },
    ],
  },
];

export function buildIdentifyResult(
  coord: Coordinate,
  hitFeature: boolean,
): IdentifyResult {
  const { dtm, dom } = pseudoHeight(coord);
  return {
    coordinate: coord,
    dtm,
    dom,
    sections: hitFeature ? PFLEGEPLAN_SECTIONS : [],
  };
}
