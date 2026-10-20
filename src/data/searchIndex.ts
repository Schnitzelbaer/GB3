import type { Coordinate } from "ol/coordinate";

import { CATALOG } from "./catalog";
import type { SearchHit, SearchHitType } from "@/types";

/* ------------------------------------------------------------------------ *
 * Synthetic search index for the GIS-Browser prototype.
 *
 * All entries are invented but placed at plausible locations in the Canton
 * of Zurich, so a hit can be previewed and jumped to on the map. The index
 * is generated deterministically (seeded) on first use: a few thousand
 * addresses, places, buildings (GVZ/EGID), parcels (Parzelle/E-GRID),
 * objects of the active maps and the catalog maps.
 * ------------------------------------------------------------------------ */

type Hit = Omit<SearchHit, "score" | "tags">;

interface Entry {
  hit: Hit;
  /** Folded text all query tokens must occur in. */
  text: string;
  /** Folded main text used for ranking (title or identifier). */
  primary: string;
  /** Identifier types: at least one token must hit the identifier itself. */
  idOnly: boolean;
}

/* ------------------------------ text helpers ----------------------------- */

/** Lower-case and strip diacritics, keeping a 1:1 character mapping. */
function foldChar(c: string): string {
  const d = c.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  return d.length === 1 ? d : (d[0] ?? c);
}
function fold(s: string): string {
  return [...s].map(foldChar).join("");
}

export const MIN_QUERY = 2;

/** Split a query into folded tokens (all must match). */
export function tokenize(query: string): string[] {
  return fold(query).split(/[\s,;]+/).filter(Boolean);
}

export function isQueryValid(query: string): boolean {
  return tokenize(query).join("").length >= MIN_QUERY;
}

export interface Segment {
  text: string;
  match: boolean;
}

/** Split text into matched / unmatched segments for bold highlighting. */
export function highlight(text: string, tokens: string[]): Segment[] {
  const chars = [...text];
  const folded = chars.map(foldChar).join("");
  const marks = chars.map(() => false);
  for (const t of tokens) {
    let i = folded.indexOf(t);
    while (i !== -1) {
      for (let k = i; k < i + t.length; k++) marks[k] = true;
      i = folded.indexOf(t, i + 1);
    }
  }
  const out: Segment[] = [];
  chars.forEach((c, i) => {
    const last = out[out.length - 1];
    if (last && last.match === marks[i]) last.text += c;
    else out.push({ text: c, match: marks[i] });
  });
  return out;
}

/* ------------------------------ random ----------------------------------- */

let seed = 20261020;
function rnd(): number {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0x100000000;
}
const rint = (min: number, max: number) => Math.floor(min + rnd() * (max - min + 1));
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length)];
}
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const jitter = ([x, y]: Coordinate, r: number): Coordinate => [
  Math.round(x + (rnd() * 2 - 1) * r),
  Math.round(y + (rnd() * 2 - 1) * r),
];
const pad = (n: number, len: number) => String(n).padStart(len, "0");

/* ------------------------------ base data -------------------------------- */

interface Gemeinde {
  name: string;
  c: Coordinate;
  plz: number[];
  /** Number of Grundbuchkreise (land-register districts). */
  kreise: number;
  /** Two-letter code used in GVZ numbers. */
  code: string;
  /** Spread of generated locations around the centre (m). */
  r: number;
}

const g = (
  name: string,
  e: number,
  n: number,
  plz: number[],
  kreise: number,
  code: string,
  r = 1100,
): Gemeinde => ({ name, c: [e, n], plz, kreise, code, r });

// Approximate LV95 centres of municipalities in the Canton of Zurich.
const GEMEINDEN: Gemeinde[] = [
  g("Zürich", 2683100, 1247700, [8001, 8002, 8003, 8004, 8005, 8006, 8008, 8032, 8037, 8038, 8041, 8044, 8045, 8046, 8047, 8048, 8049, 8050, 8051, 8052, 8053, 8055, 8057], 5, "ZH", 3500),
  g("Winterthur", 2697000, 1261800, [8400, 8404, 8405, 8406, 8408, 8409, 8411], 4, "WI", 3000),
  g("Uster", 2696300, 1245400, [8610], 3, "US", 1600),
  g("Dübendorf", 2689000, 1250500, [8600], 2, "DU", 1400),
  g("Dietikon", 2672300, 1251600, [8953], 2, "DI", 1200),
  g("Wetzikon", 2703600, 1242200, [8620], 3, "WE", 1500),
  g("Wädenswil", 2693600, 1231500, [8820], 3, "WA", 1600),
  g("Horgen", 2687600, 1235200, [8810], 2, "HO", 1500),
  g("Kloten", 2686300, 1257200, [8302], 2, "KL", 1400),
  g("Bülach", 2682700, 1264000, [8180], 2, "BU", 1300),
  g("Regensdorf", 2677100, 1255700, [8105], 2, "RE", 1300),
  g("Affoltern am Albis", 2676900, 1236800, [8910], 4, "AF", 1200),
  g("Meilen", 2691600, 1236600, [8706], 2, "ME", 1300),
  g("Thalwil", 2684600, 1238300, [8800], 2, "TH", 1000),
  g("Adliswil", 2681700, 1241500, [8134], 2, "AD", 1100),
  g("Schlieren", 2675900, 1249800, [8952], 1, "SE", 1000),
  g("Opfikon", 2686000, 1253300, [8152], 1, "OP", 1000),
  g("Volketswil", 2694200, 1249600, [8604], 2, "VO", 1100),
  g("Küsnacht", 2686900, 1241500, [8700], 2, "KU", 1200),
  g("Zollikon", 2685500, 1243800, [8702], 2, "ZO", 1100),
  g("Stäfa", 2697600, 1231900, [8712], 2, "ST", 1300),
  g("Rüti", 2706500, 1234300, [8630], 1, "RU", 1000),
  g("Hinwil", 2706200, 1239600, [8340], 2, "HI", 1400),
  g("Bassersdorf", 2689700, 1256700, [8303], 1, "BA", 900),
  g("Bachenbülach", 2683700, 1261900, [8184], 3, "BB", 700),
  g("Altikon", 2705900, 1268300, [8479], 2, "AL", 700),
  g("Fehraltorf", 2698200, 1251300, [8320], 1, "FE", 800),
  g("Weisslingen", 2701700, 1255500, [8484], 2, "WS", 900),
  g("Illnau-Effretikon", 2693600, 1253800, [8307, 8308], 3, "IE", 1600),
  g("Embrach", 2687600, 1263400, [8424], 1, "EM", 900),
  g("Andelfingen", 2693500, 1272600, [8450], 2, "AN", 1000),
  g("Pfäffikon", 2700300, 1247200, [8330], 2, "PF", 1300),
  g("Richterswil", 2697300, 1228900, [8805], 2, "RI", 1100),
  g("Männedorf", 2694700, 1233900, [8708], 1, "MA", 900),
  g("Egg", 2697200, 1241600, [8132], 2, "EG", 1200),
  g("Wallisellen", 2687000, 1252200, [8304], 1, "WL", 900),
  g("Rafz", 2680800, 1274900, [8197], 1, "RA", 1000),
  g("Eglisau", 2680700, 1269500, [8193], 1, "EL", 1000),
  g("Feuerthalen", 2690600, 1281400, [8245], 1, "FT", 700),
  g("Marthalen", 2691500, 1275800, [8460], 1, "MR", 900),
  g("Elgg", 2711400, 1261400, [8353], 1, "EG", 900),
  g("Turbenthal", 2706500, 1257000, [8488], 2, "TU", 1200),
  g("Bauma", 2711000, 1248200, [8494], 2, "BM", 1500),
  g("Greifensee", 2693300, 1246800, [8606], 1, "GR", 600),
  g("Maur", 2692300, 1243600, [8124], 2, "MU", 1200),
  g("Langnau am Albis", 2682300, 1236700, [8135], 1, "LA", 1000),
  g("Birmensdorf", 2676700, 1245600, [8903], 1, "BI", 1000),
  g("Urdorf", 2674900, 1248400, [8902], 1, "UR", 900),
  g("Niederhasli", 2679900, 1258400, [8155], 2, "NH", 1000),
  g("Dielsdorf", 2676900, 1259400, [8157], 1, "DD", 800),
  g("Hedingen", 2675600, 1239600, [8908], 1, "HE", 800),
  g("Obfelden", 2673700, 1235300, [8912], 1, "OB", 900),
  g("Uetikon am See", 2692900, 1235000, [8707], 1, "UE", 800),
  g("Seuzach", 2697000, 1265700, [8472], 1, "SZ", 900),
  g("Neftenbach", 2692500, 1264800, [8413], 2, "NE", 1100),
  g("Stallikon", 2678600, 1243100, [8143], 1, "SK", 1000),
];
const GEMEINDE = new Map(GEMEINDEN.map((x) => [x.name, x]));
const gem = (name: string) => GEMEINDE.get(name)!;

const STREETS = [
  "Bahnhofstrasse", "Hauptstrasse", "Dorfstrasse", "Kirchgasse", "Schulstrasse",
  "Seestrasse", "Zürcherstrasse", "Industriestrasse", "Landstrasse", "Malvenstrasse",
  "Rosenweg", "Lindenstrasse", "Gartenstrasse", "Bergstrasse", "Feldstrasse",
  "Wiesenstrasse", "Mühlestrasse", "Poststrasse", "Kirchstrasse", "Weinbergstrasse",
  "Sonnenbergstrasse", "Ahornweg", "Birkenweg", "Eichenstrasse", "Buchenweg",
  "Tannenstrasse", "Föhrenweg", "Alte Landstrasse", "Rebbergstrasse", "Obere Dorfstrasse",
  "Talstrasse", "Brunnenstrasse", "Forchstrasse", "Winterthurerstrasse", "Schaffhauserstrasse",
  "Badenerstrasse", "Rietstrasse", "Grabenstrasse", "Neugasse", "Marktgasse",
  "Steinackerstrasse", "Hofwiesenstrasse", "Kantonsstrasse", "Florastrasse", "Sternenstrasse",
  "Rütistrasse", "Usterstrasse", "Im Grund", "Chilegass", "Sagenstrasse",
];
/** Long through-roads get high house numbers. */
const LONG = new Set([
  "Bahnhofstrasse", "Hauptstrasse", "Dorfstrasse", "Seestrasse", "Zürcherstrasse",
  "Industriestrasse", "Landstrasse", "Alte Landstrasse", "Forchstrasse",
  "Winterthurerstrasse", "Schaffhauserstrasse", "Badenerstrasse", "Kantonsstrasse",
  "Usterstrasse",
]);

const FLURNAMEN = [
  "Allmend", "Riet", "Brühl", "Moos", "Hard", "Au", "Halde", "Eichholz", "Bühl",
  "Rüti", "Ried", "Chalberweid", "Wolfgalgen", "Bergli", "Tobel", "Hasenbüel",
  "Lättenwiesen", "Aegerten", "Breiti", "Chilefeld", "Grossacher", "Langacher",
  "Oberfeld", "Unterdorf", "Oberdorf", "Hinterdorf", "Steinacher", "Weid", "Gibel",
  "Sonnenhalde",
];

/** Places with a fixed location: [title, category, Gemeinde, E, N, resolution]. */
const PLACES: [string, string, string, number, number, number][] = [
  ["Uetliberg", "Aussichtspunkt", "Stallikon", 2679560, 1244710, 2],
  ["Pfannenstiel", "Aussichtspunkt", "Egg", 2694700, 1238800, 2],
  ["Bachtel", "Aussichtspunkt", "Hinwil", 2710300, 1240400, 2],
  ["Albis Hochwacht", "Aussichtspunkt", "Langnau am Albis", 2682000, 1234000, 2],
  ["Lägern Hochwacht", "Aussichtspunkt", "Dielsdorf", 2671500, 1259600, 2],
  ["Irchel Hochwacht", "Aussichtspunkt", "Neftenbach", 2689500, 1268200, 2],
  ["Hörnli", "Aussichtspunkt", "Bauma", 2714800, 1247800, 2],
  ["Schauenberg", "Aussichtspunkt", "Turbenthal", 2706700, 1260500, 2],
  ["Greifensee", "See", "Greifensee", 2694300, 1246400, 6],
  ["Pfäffikersee", "See", "Pfäffikon", 2701000, 1245200, 6],
  ["Türlersee", "See", "Hedingen", 2679000, 1238600, 4],
  ["Katzensee", "See", "Regensdorf", 2680500, 1255000, 4],
  ["Lützelsee", "See", "Hinwil", 2703000, 1236800, 4],
  ["Hüttnersee", "See", "Richterswil", 2694300, 1227300, 4],
  ["Rheinfall", "Sehenswürdigkeit", "Feuerthalen", 2688200, 1281500, 2],
  ["Schloss Laufen", "Schloss", "Feuerthalen", 2688100, 1281200, 1.5],
  ["Schloss Kyburg", "Schloss", "Illnau-Effretikon", 2698800, 1257400, 1.5],
  ["Schloss Greifensee", "Schloss", "Greifensee", 2693800, 1246200, 1.5],
  ["Burg Uster", "Schloss", "Uster", 2696600, 1245600, 1.5],
  ["Mörsburg", "Schloss", "Winterthur", 2700300, 1264900, 1.5],
  ["Sihlwald", "Wald", "Horgen", 2685000, 1235400, 4],
  ["Eschenberg", "Wald", "Winterthur", 2697000, 1259000, 4],
  ["Thurauen", "Naturschutzgebiet", "Andelfingen", 2689000, 1272500, 4],
  ["Neeracherried", "Naturschutzgebiet", "Niederhasli", 2678700, 1261000, 3],
  ["Glattpark", "Quartier", "Opfikon", 2685600, 1254200, 2],
  ["Zoo Zürich", "Sehenswürdigkeit", "Zürich", 2686100, 1247600, 1.5],
  ["Polyterrasse", "Platz", "Zürich", 2683800, 1247600, 1],
  ["Hallenstadion", "Sehenswürdigkeit", "Zürich", 2683700, 1251700, 1.5],
  ["Flughafen Zürich", "Flughafen", "Kloten", 2685500, 1257500, 6],
  ["Lindenhof", "Platz", "Zürich", 2683100, 1247500, 1],
  ["Chinagarten", "Park", "Zürich", 2683800, 1245900, 1],
  ["Werdinsel", "Insel", "Zürich", 2678700, 1251000, 1.5],
  ["Sechseläutenplatz", "Platz", "Zürich", 2683700, 1246800, 1],
  ["Zürich HB", "Bahnhof", "Zürich", 2683200, 1248100, 1.5],
  ["Brunau", "Quartier", "Zürich", 2681900, 1244900, 2],
  ["Altstetten", "Quartier", "Zürich", 2678900, 1249300, 3],
  ["Oerlikon", "Quartier", "Zürich", 2683600, 1251600, 3],
  ["Seebach", "Quartier", "Zürich", 2683200, 1253500, 3],
  ["Wipkingen", "Quartier", "Zürich", 2681900, 1249200, 3],
  ["Wollishofen", "Quartier", "Zürich", 2682500, 1243600, 3],
  ["Hottingen", "Quartier", "Zürich", 2684900, 1247200, 3],
  ["Enge", "Quartier", "Zürich", 2682800, 1246000, 3],
  ["Wiedikon", "Quartier", "Zürich", 2681700, 1247000, 3],
  ["Witikon", "Quartier", "Zürich", 2687400, 1246400, 3],
  ["Höngg", "Quartier", "Zürich", 2680400, 1250600, 3],
  ["Affoltern", "Quartier", "Zürich", 2681000, 1253800, 3],
  ["Schwamendingen", "Quartier", "Zürich", 2685900, 1251700, 3],
  ["Leimbach", "Quartier", "Zürich", 2681200, 1242800, 3],
  ["Fluntern", "Quartier", "Zürich", 2684800, 1248200, 3],
  ["Hirslanden", "Quartier", "Zürich", 2684900, 1245900, 3],
  ["Töss", "Quartier", "Winterthur", 2695800, 1260300, 3],
  ["Veltheim", "Quartier", "Winterthur", 2696500, 1263800, 3],
  ["Oberwinterthur", "Quartier", "Winterthur", 2699600, 1263200, 3],
  ["Seen", "Quartier", "Winterthur", 2699800, 1260300, 3],
  ["Wülflingen", "Quartier", "Winterthur", 2694400, 1263100, 3],
  ["Mattenbach", "Quartier", "Winterthur", 2698600, 1261200, 3],
];

/** Municipalities on the cantonal border that get boundary stones. */
const BORDER = [
  "Rafz", "Eglisau", "Feuerthalen", "Marthalen", "Elgg", "Bauma", "Rüti",
  "Richterswil", "Obfelden", "Dietikon", "Hinwil", "Altikon",
];

/** Search index of the active maps. Several maps can share one index. */
export const SEARCH_INDEXES: { id: string; mapIds: string[] }[] = [
  { id: "bauten", mapIds: ["gebaeude", "bauprojekte"] },
];
const GB = ["gebaeude"];
const BP = ["bauprojekte"];
const BOTH = ["gebaeude", "bauprojekte"];

/** Notable objects: [title, Gemeinde, map ids]. */
const OBJECTS: [string, string, string[]][] = [
  ["Kantonalstrasse 546, km 0–4.238", "Fehraltorf", BOTH],
  ["Prime Tower", "Zürich", GB],
  ["Hallenstadion", "Zürich", GB],
  ["Kunsthaus Zürich", "Zürich", GB],
  ["Universitätsspital Zürich", "Zürich", GB],
  ["Schulhaus Leutschenbach", "Zürich", GB],
  ["Kantonsschule Wetzikon", "Wetzikon", GB],
  ["Spital Uster", "Uster", GB],
  ["Stadthaus Winterthur", "Winterthur", GB],
  ["Technikum Winterthur", "Winterthur", GB],
  ["Wohnsiedlung Glattpark", "Opfikon", GB],
  ["Kantonsschule Küsnacht", "Küsnacht", GB],
  ["Bezirksgebäude Dielsdorf", "Dielsdorf", GB],
  ["Ausbau Glattalbahn, Etappe 3", "Dübendorf", BP],
  ["Neubau Kantonsschule Uetikon am See", "Uetikon am See", BOTH],
  ["Hochwasserschutz Sihl, Abschnitt Langnau", "Langnau am Albis", BP],
  ["Velobahn Zürich–Dübendorf", "Zürich", BP],
  ["Ersatzneubau Limmatbrücke", "Dietikon", BP],
  ["Sanierung Seestrasse, Abschnitt Meilen", "Meilen", BP],
  ["Brüttener Tunnel, Installationsplatz", "Bassersdorf", BP],
  ["Polizei- und Justizzentrum", "Zürich", BOTH],
  ["Erweiterung Spital Bülach", "Bülach", BOTH],
  ["Tram Affoltern", "Zürich", BP],
  ["Umfahrung Eglisau", "Eglisau", BP],
  ["Renaturierung Glatt", "Opfikon", BP],
  ["Neubau Hallenbad Wädenswil", "Wädenswil", BOTH],
];

/* -------------------------------- builder -------------------------------- */

function buildIndex(): Entry[] {
  const entries: Entry[] = [];
  const seen = new Set<string>();

  function add(hit: Hit, searchable: string[], primary: string, idOnly = false) {
    const key = `${hit.type}|${hit.title}|${hit.value ?? ""}|${hit.context ?? ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    entries.push({
      hit,
      text: fold(searchable.join(" ")),
      primary: fold(primary),
      idOnly,
    });
  }

  /* --- Adressen --- */
  const address = (street: string, nr: number, plz: number, gName: string, c: Coordinate) => {
    const title = `${street} ${nr}, ${plz} ${gName}`;
    add(
      { id: `adr:${title}`, type: "adresse", title, label: "Adresse", coordinate: c, resolution: 0.4 },
      [title],
      title,
    );
  };
  // Curated examples from the design screens (search term "546").
  const near = (gName: string, r = 400) => jitter(gem(gName).c, r);
  address("Malvenstrasse", 546, 8057, "Zürich", [2682700, 1250600]);
  address("Hauptstrasse", 546, 8484, "Weisslingen", near("Weisslingen"));
  address("Dorfstrasse", 546, 8320, "Fehraltorf", near("Fehraltorf"));
  address("Bahnhofstrasse", 546, 8952, "Schlieren", near("Schlieren"));
  address("Industriestrasse", 546, 8604, "Volketswil", near("Volketswil"));
  address("Landstrasse", 546, 8953, "Dietikon", near("Dietikon"));
  address("Seestrasse", 546, 8706, "Meilen", near("Meilen"));
  address("Zürcherstrasse", 546, 8620, "Wetzikon", near("Wetzikon"));

  for (const gm of GEMEINDEN) {
    const nStreets = gm.name === "Zürich" ? 45 : gm.name === "Winterthur" ? 32 : rint(9, 16);
    for (const street of shuffle(STREETS).slice(0, nStreets)) {
      const plz = pick(gm.plz);
      const anchor = jitter(gm.c, gm.r);
      const max = LONG.has(street) ? 700 : 140;
      const nums = new Set<number>();
      const n = rint(2, 7);
      while (nums.size < n) nums.add(rint(1, max));
      for (const nr of [...nums].sort((a, b) => a - b))
        address(street, nr, plz, gm.name, jitter(anchor, 180));
    }
  }

  /* --- Orte --- */
  const ort = (title: string, context: string, c: Coordinate, resolution: number) =>
    add(
      { id: `ort:${title}|${context}`, type: "ort", title, label: "Ort", context, coordinate: c, resolution },
      [title, context],
      title,
    );
  for (const [title, cat, gName, e, n, res] of PLACES)
    ort(title, `${cat}, Gemeinde ${gName}`, [e, n], res);
  for (const gm of GEMEINDEN) {
    ort(gm.name, "Politische Gemeinde", gm.c, 12);
    ort(`Bahnhof ${gm.name}`, `Bahnhof, Gemeinde ${gm.name}`, jitter(gm.c, gm.r * 0.4), 1.2);
    for (const flur of shuffle(FLURNAMEN).slice(0, 3))
      ort(flur, `Flurname, Gemeinde ${gm.name}`, jitter(gm.c, gm.r), 2.5);
  }
  ort("Landesgrenzstein 546", "Gemeinde Rafz", jitter(gem("Rafz").c, 1600), 0.6);
  ort("Landesgrenzstein 546", "Gemeinde Feuerthalen", jitter(gem("Feuerthalen").c, 1200), 0.6);
  for (const gName of BORDER) {
    const gm = gem(gName);
    const nums = new Set<number>();
    while (nums.size < 30) nums.add(rint(1, 720));
    for (const nr of [...nums].sort((a, b) => a - b))
      ort(`Landesgrenzstein ${nr}`, `Gemeinde ${gName}`, jitter(gm.c, gm.r * 1.8), 0.6);
  }

  /* --- Gebäude (GVZ-Nummer, EGID) and Grundstücke (Parzelle, E-GRID) --- */
  const idHit = (
    type: SearchHitType,
    label: string,
    value: string,
    kreis: number,
    gName: string,
    c: Coordinate,
  ) =>
    add(
      {
        id: `${type}:${value}|${gName}`,
        type,
        title: `${kreis} ${gName}`,
        label,
        value,
        coordinate: c,
        resolution: 0.4,
      },
      [value, gName],
      value,
      true,
    );
  // Curated examples from the design screens.
  idHit("gvz", "GVZ-Nummer", "546-SE00803", 4, "Affoltern am Albis", near("Affoltern am Albis"));
  idHit("gvz", "GVZ-Nummer", "546-AF01277", 2, "Affoltern am Albis", near("Affoltern am Albis"));
  idHit("gvz", "GVZ-Nummer", "546-UR00412", 1, "Urdorf", near("Urdorf"));
  idHit("parzelle", "Parzellennummer", "4546", 2, "Altikon", near("Altikon"));
  idHit("parzelle", "Parzellennummer", "546", 1, "Uster", near("Uster"));
  idHit("egrid", "E-GRID", "CH745460889908", 3, "Bachenbülach", near("Bachenbülach"));
  idHit("egid", "EGID", "100234546", 1, "Bassersdorf", near("Bassersdorf"));
  idHit("egid", "EGID", "190546221", 2, "Uster", near("Uster"));

  for (const gm of GEMEINDEN) {
    const n = gm.name === "Zürich" ? 140 : gm.name === "Winterthur" ? 80 : rint(8, 18);
    for (let i = 0; i < n; i++) {
      const kreis = rint(1, gm.kreise);
      const c = jitter(gm.c, gm.r);
      idHit("gvz", "GVZ-Nummer", `${rint(1, 2500)}-${gm.code}${pad(rint(1, 99999), 5)}`, kreis, gm.name, c);
      idHit("egid", "EGID", String(rint(100000000, 199999999)), kreis, gm.name, c);
    }
    const parcels = new Set<string>();
    while (parcels.size < n) parcels.add(`${rint(1, gm.kreise)}|${rint(1, 9999)}`);
    for (const p of parcels) {
      const [kreis, nr] = p.split("|").map(Number);
      const c = jitter(gm.c, gm.r);
      idHit("parzelle", "Parzellennummer", String(nr), kreis, gm.name, c);
      idHit("egrid", "E-GRID", `CH${pad(rint(0, 999999), 6)}${pad(rint(0, 999999), 6)}`, kreis, gm.name, c);
    }
  }

  /* --- Objekte aus aktiven Karten (shared index Gebäude + Bauprojekte) --- */
  const obj = (title: string, gName: string, mapIds: string[], c?: Coordinate) =>
    add(
      {
        id: `obj:${title}`,
        type: "objekt",
        title,
        label: "Objekt",
        mapIds,
        coordinate: c ?? jitter(gem(gName).c, gem(gName).r * 0.7),
        resolution: 1,
      },
      [title, gName],
      title,
    );
  for (const [title, gName, mapIds] of OBJECTS) obj(title, gName, mapIds);
  for (const gm of GEMEINDEN) {
    obj(gm.name === "Zürich" || gm.name === "Winterthur" ? `Stadthaus ${gm.name}` : `Gemeindehaus ${gm.name}`, gm.name, GB);
    obj(`Schulanlage ${pick(FLURNAMEN)}, ${gm.name}`, gm.name, GB);
    if (rnd() < 0.5) obj(`Sanierung ${pick(STREETS)}, ${gm.name}`, gm.name, BP);
    if (rnd() < 0.3) obj(`Neubau Werkhof ${gm.name}`, gm.name, BOTH);
    if (rnd() < 0.35) obj(`Mehrzweckhalle ${gm.name}`, gm.name, GB);
  }
  for (let i = 0; i < 30; i++) {
    const gm = pick(GEMEINDEN);
    const from = rint(0, 9);
    const to = (from + rint(400, 6000) / 1000).toFixed(3);
    obj(`Kantonalstrasse ${rint(1, 700)}, km ${from}–${to}`, gm.name, rnd() < 0.3 ? BOTH : BP);
  }

  /* --- Karten aus dem Kartenkatalog --- */
  for (const theme of CATALOG)
    for (const m of theme.maps)
      add(
        { id: `karte:${m.id}`, type: "karte", title: m.title, label: "Karte", catalogId: m.id },
        [m.title, theme.title],
        m.title,
      );

  return entries;
}

let INDEX: Entry[] | null = null;
const index = () => (INDEX ??= buildIndex());

/* -------------------------------- search --------------------------------- */

function score(primary: string, q: string, tokens: string[]): number {
  let s = 40;
  if (primary === q) s = 100;
  else if (primary.startsWith(q)) s = 85;
  else if (primary.includes(q)) s = 70;
  else if (primary.split(/[^a-z0-9]+/).some((w) => w.startsWith(tokens[0]))) s = 55;
  // Whole-word hits (e.g. house number 546, not 1546) rank higher.
  const words = primary.split(/[^a-z0-9]+/);
  if (tokens.every((t) => words.includes(t))) s += 12;
  return s - primary.length / 1000;
}

/** All index entries matching the query, sorted by relevance. */
export function search(query: string): SearchHit[] {
  const tokens = tokenize(query);
  if (tokens.join("").length < MIN_QUERY) return [];
  const q = tokens.join(" ");
  const out: SearchHit[] = [];
  for (const e of index()) {
    if (!tokens.every((t) => e.text.includes(t))) continue;
    if (e.idOnly && !tokens.some((t) => e.primary.includes(t))) continue;
    out.push({ ...e.hit, score: score(e.primary, q, tokens) });
  }
  out.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "de"));
  return out;
}

/* ------------------------------- view model ------------------------------ */

export interface SearchFilter {
  id: string;
  label: string;
  count: number;
}
export interface FilterSection {
  id: string;
  title: string;
  filters: SearchFilter[];
}
export interface ResultGroup {
  key: string;
  title: string;
  /** Plural for the accordion button ("Alle 8 Adressen anzeigen"). */
  plural: string;
  hits: SearchHit[];
}
export interface SearchView {
  sections: FilterSection[];
  groups: ResultGroup[];
  total: number;
  /** Active filters that still exist (stale map filters dropped). */
  effective: Set<string>;
}

const TYPE_GROUPS: { type: SearchHitType; title: string; plural: string }[] = [
  { type: "adresse", title: "Adressen", plural: "Adressen" },
  { type: "ort", title: "Orte", plural: "Orte" },
  { type: "gvz", title: "GVZ-Nummer", plural: "GVZ-Nummern" },
  { type: "parzelle", title: "Parzellennummer", plural: "Parzellennummern" },
  { type: "egrid", title: "E-GRID", plural: "E-GRIDs" },
  { type: "egid", title: "EGID", plural: "EGIDs" },
];

/**
 * Group hits, derive filter counts and apply the active filters. Counts only
 * depend on the query (not on the selected filters); filters combine with OR.
 */
export function buildView(
  hits: SearchHit[],
  activeMaps: { id: string; title: string }[],
  active: Set<string>,
): SearchView {
  const byType = new Map<SearchHitType, SearchHit[]>();
  for (const h of hits) {
    const list = byType.get(h.type);
    if (list) list.push(h);
    else byType.set(h.type, [h]);
  }
  const titleOf = new Map(activeMaps.map((m) => [m.id, m.title]));

  const objekte = byType.get("objekt") ?? [];
  const indexes = SEARCH_INDEXES.map((ix) => {
    const maps = ix.mapIds.filter((id) => titleOf.has(id));
    const available = objekte
      .filter((h) => h.mapIds?.some((id) => maps.includes(id)))
      .map((h) => ({
        ...h,
        tags: h.mapIds!.filter((id) => maps.includes(id)).map((id) => titleOf.get(id)!),
      }));
    return { ix, maps, available };
  });

  const mapFilters = indexes.flatMap(({ maps, available }) =>
    maps.map((id) => ({
      id: `map:${id}`,
      label: titleOf.get(id)!,
      count: available.filter((h) => h.mapIds!.includes(id)).length,
    })),
  );
  const karten = byType.get("karte") ?? [];

  const sections: FilterSection[] = [
    {
      id: "orte",
      title: "Orte & Objekte",
      filters: TYPE_GROUPS.map((t) => ({
        id: t.type,
        label: t.title,
        count: byType.get(t.type)?.length ?? 0,
      })),
    },
    ...(mapFilters.length
      ? [{ id: "aktiv", title: "In aktiven Karten", filters: mapFilters }]
      : []),
    {
      id: "katalog",
      title: "Kartenkatalog",
      filters: [{ id: "karte", label: "Karten", count: karten.length }],
    },
  ];

  const ids = new Set(sections.flatMap((s) => s.filters.map((f) => f.id)));
  const effective = new Set([...active].filter((id) => ids.has(id)));
  const none = effective.size === 0;

  const groups: ResultGroup[] = [];
  for (const t of TYPE_GROUPS) {
    const list = byType.get(t.type) ?? [];
    if (list.length && (none || effective.has(t.type)))
      groups.push({ key: t.type, title: t.title, plural: t.plural, hits: list });
  }
  for (const { ix, maps, available } of indexes) {
    const included = none ? maps : maps.filter((id) => effective.has(`map:${id}`));
    if (!included.length) continue;
    const list = available.filter((h) => h.mapIds!.some((id) => included.includes(id)));
    if (list.length)
      groups.push({
        key: `index:${ix.id}`,
        title: included.map((id) => titleOf.get(id)).join(" & "),
        plural: "Objekte",
        hits: list,
      });
  }
  if (karten.length && (none || effective.has("karte")))
    groups.push({ key: "karte", title: "Kartenkatalog", plural: "Karten", hits: karten });

  return {
    sections,
    groups,
    total: groups.reduce((n, gr) => n + gr.hits.length, 0),
    effective,
  };
}
