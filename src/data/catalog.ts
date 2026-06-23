import type { CatalogTheme } from "@/types";

/**
 * The GIS-Browser groups ~200 maps into 21 main themes. For the prototype we
 * reproduce the full theme list and fill a handful of them with realistic
 * example maps (the "Flora und Fauna" entries match the live viewer).
 */
export const CATALOG: CatalogTheme[] = [
  {
    id: "av",
    title: "Amtliche Vermessung",
    maps: [
      { id: "av-uebersicht", title: "AV-Übersichtsplan" },
      { id: "av-liegenschaften", title: "Liegenschaften" },
      { id: "av-bodenbedeckung", title: "Bodenbedeckung" },
      { id: "av-gebaeudeadressen", title: "Gebäudeadressen" },
    ],
  },
  {
    id: "bauten",
    title: "Bauten",
    maps: [
      { id: "bauten-zonen", title: "Bauzonen Kanton Zürich" },
      { id: "bauten-energie", title: "Gebäudeenergieausweis (GEAK)" },
      { id: "bauten-denkmal", title: "Inventar der Denkmalpflege" },
    ],
  },
  {
    id: "boden",
    title: "Boden",
    maps: [
      { id: "boden-eignung", title: "Bodeneignungskarte" },
      { id: "boden-belastung", title: "Kataster der belasteten Standorte" },
      { id: "boden-fruchtfolge", title: "Fruchtfolgeflächen" },
    ],
  },
  {
    id: "energie",
    title: "Energie",
    maps: [
      { id: "energie-solar", title: "Solarkataster – Eignung Dächer" },
      { id: "energie-fernwaerme", title: "Fernwärme-Versorgungsgebiete" },
    ],
  },
  {
    id: "freizeit",
    title: "Freizeit und Erholung",
    maps: [
      { id: "freizeit-wander", title: "Wanderwege" },
      { id: "freizeit-velo", title: "Veloland Routen" },
      { id: "freizeit-grill", title: "Feuerstellen und Grillplätze" },
    ],
  },
  {
    id: "geologie",
    title: "Geologie",
    maps: [
      { id: "geologie-grundwasser", title: "Grundwasserschutzzonen" },
      { id: "geologie-baugrund", title: "Baugrundklassen" },
    ],
  },
  {
    id: "geschichte",
    title: "Geschichte und Kultur",
    maps: [
      { id: "geschichte-erstausgabe", title: "Erstausgabe Landeskarte 1:25'000" },
      { id: "geschichte-wild", title: "Wildkarte (1850)" },
    ],
  },
  {
    id: "flora-fauna",
    title: "Flora und Fauna, Vegetation",
    maps: [
      { id: "pflegeplan-aktuell", title: "1. Pflegeplan Naturschutz-Teilflächen: aktuelles Jahr" },
      { id: "pflegeplan-vergangen", title: "2. Pflegeplan Naturschutz-Teilflächen: vergangenes Jahr" },
      { id: "pflegeplan-vorvergangen", title: "3. Pflegeplan Naturschutz-Teilflächen: vorvergangenes Jahr" },
      { id: "tierseuchen", title: "Aktuelle Zonierung Tierseuchen" },
      { id: "neozoen", title: "Aquatische Neozoen" },
      { id: "bienen", title: "Bienenstände" },
      { id: "bun-archiv", title: "BUN Massnahmen Archiv" },
      { id: "feldhasen", title: "Feldhasen- und Feldlerchenförderung mit Getreide in weiter Reihe (Vernetzung)" },
    ],
  },
  {
    id: "gewaesser",
    title: "Gewässer",
    maps: [
      { id: "gewaesser-netz", title: "Gewässernetz" },
      { id: "gewaesser-raum", title: "Gewässerraum" },
      { id: "gewaesser-oekomorph", title: "Ökomorphologie Fliessgewässer" },
    ],
  },
  {
    id: "hoehen",
    title: "Höhen und Relief",
    maps: [
      { id: "hoehen-dom", title: "Digitales Oberflächenmodell (DOM)" },
      { id: "hoehen-dtm", title: "Digitales Terrainmodell (DTM)" },
      { id: "hoehen-hangneigung", title: "Hangneigungskarte" },
    ],
  },
  {
    id: "landwirtschaft",
    title: "Landwirtschaft",
    maps: [
      { id: "lw-nutzungsflaechen", title: "Landwirtschaftliche Nutzflächen" },
      { id: "lw-rebbau", title: "Rebbaukataster" },
    ],
  },
  {
    id: "luft-klima",
    title: "Luft und Klima",
    maps: [
      { id: "klima-analyse", title: "Klimaanalysekarte" },
      { id: "luft-no2", title: "Stickstoffdioxid (NO₂) Jahresmittel" },
    ],
  },
  {
    id: "naturgefahren",
    title: "Naturgefahren",
    maps: [
      { id: "ng-gefahrenkarte", title: "Gefahrenkarte" },
      { id: "ng-hochwasser", title: "Hochwasserintensität" },
    ],
  },
  {
    id: "planung",
    title: "Planung und Zonen",
    maps: [
      { id: "planung-richtplan", title: "Kantonaler Richtplan" },
      { id: "planung-nutzungsplanung", title: "Kommunale Nutzungsplanung" },
    ],
  },
  {
    id: "umwelt",
    title: "Umwelt",
    maps: [
      { id: "umwelt-laerm-strasse", title: "Strassenlärm Tag" },
      { id: "umwelt-altlasten", title: "Altlastenverdachtsflächen" },
    ],
  },
  {
    id: "verkehr",
    title: "Verkehr",
    maps: [
      { id: "verkehr-oev", title: "ÖV-Güteklassen" },
      { id: "verkehr-dtv", title: "Durchschnittlicher Tagesverkehr (DTV)" },
    ],
  },
  {
    id: "versorgung",
    title: "Ver- und Entsorgung",
    maps: [
      { id: "vs-leitungskataster", title: "Leitungskataster" },
      { id: "vs-abfall", title: "Sammelstellen" },
    ],
  },
  {
    id: "grenzen",
    title: "Verwaltungsgrenzen",
    maps: [
      { id: "grenzen-gemeinden", title: "Gemeindegrenzen" },
      { id: "grenzen-bezirke", title: "Bezirksgrenzen" },
    ],
  },
  {
    id: "wald",
    title: "Wald",
    maps: [
      { id: "wald-eigentum", title: "Waldeigentum" },
      { id: "wald-funktionen", title: "Waldfunktionen" },
    ],
  },
  {
    id: "laerm",
    title: "Lärm und NIS",
    maps: [
      { id: "laerm-bahn", title: "Eisenbahnlärm" },
      { id: "laerm-nis", title: "Standorte Mobilfunk (NIS)" },
    ],
  },
  {
    id: "basiskarten",
    title: "Basiskarten",
    maps: [
      { id: "basis-uebersicht", title: "Übersichtsplan" },
      { id: "basis-landeskarte", title: "Landeskarten swisstopo" },
    ],
  },
];

/** Map id that is bound to the interactive sample overlay on the map. */
export const HERO_LAYER_ID = "pflegeplan-aktuell";
export const HERO_LAYER_TITLE =
  "1. Pflegeplan Naturschutz-Teilflächen: aktuelles Jahr";
