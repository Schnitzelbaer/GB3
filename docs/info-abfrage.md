# Info-Abfrage – Feature-Beschreibung (funktional / UX)

> Konzeptbeschreibung des Werkzeugs «Info-Abfrage» im GB3-Prototyp (Design-Nachbau
> des GIS-Browsers Geoportal Kanton Zürich). Der Prototyp dient dem Gestalten und
> Testen von Karten-Werkzeugen; die angezeigten Inhalte sind realistische
> **Mock-Daten**, kein echter Datendienst. Diese Beschreibung ist rein funktional
> (Verhalten und Bedienung) – ohne Code- oder Datei-Details.

## Zweck

Mit der Info-Abfrage fragt man an einer Stelle bzw. in einem Bereich der Karte ab,
**was dort vorhanden ist** und **welche Sachdaten** dazu gehören. Die Abfrage
beantwortet je nach gewählter Abfrage-Art drei unterschiedliche Fragen:

- **Features** – Welche konkreten Objekte liegen hier, und was sind ihre Sachdaten?
- **Statistik** – Wie sehen die statistischen Kennzahlen der getroffenen Objekte aus?
- **Datasets** – Welche Datensätze aus dem Kartenkatalog haben hier überhaupt Daten?

## Werkzeug und Aktivierung

- Die Info-Abfrage wird über das **Info-Werkzeug** in der rechten Werkzeugleiste
  gesteuert. Es ist standardmässig aktiv.
- Das Info-Werkzeug **kann nicht abgewählt werden**. Erst die Auswahl eines anderen
  Werkzeugs (Messen, Zeichnen, Daten beziehen, …) deaktiviert es; dabei wird auch das
  Info-Panel geschlossen und eine allfällige Abfrage-Geometrie entfernt.
- Das **Icon des Info-Werkzeugs spiegelt die aktuell gewählte Abfrage-Art** wider
  (Features / Statistik / Datasets), ebenso der Tooltip beim Darüberfahren
  (z. B. «Features Abfrage»).
- Beim Aktivieren des Werkzeugs **erscheint das Info-Panel nicht automatisch** – und
  der Mauszeiger bleibt der Standard-Cursor (kein Fadenkreuz).

## Abfrage-Art wählen (Flyout)

- Ein Klick auf das Info-Werkzeug blendet **links neben der Werkzeugleiste eine zweite
  Spalte ein** mit den drei Abfrage-Arten als Icons: **Features**, **Statistik**,
  **Datasets**.
- Sobald eine Art gewählt wird, **schliesst sich diese Spalte wieder**; das
  Info-Werkzeug bleibt aktiv. Ein Panel öffnet sich dadurch noch nicht.
- Die Abfrage-Art lässt sich auch **im Panel über die Tabs** oben wechseln – beide
  Wege steuern denselben Zustand (synchron).

## Ablauf einer Abfrage

1. Info-Werkzeug ist aktiv, Abfrage-Art ist gewählt (Standard: Features).
2. **Klick in die Karte** – erst dadurch öffnet sich das Info-Panel rechts und zeigt
   das Ergebnis für die gewählte Art und den gewählten Modus.
3. An der Abfragestelle erscheint ein **Pin**, und die Abfrage-Geometrie
   (z. B. Kreis oder Polygon) wird **auf der Karte dargestellt**.
4. Weitere Klicks lösen neue Abfragen aus; die gewählten Einstellungen bleiben
   erhalten (siehe «Verhalten und Zustände»).

## Abfrage-Modi (wo und wie abgefragt wird)

Der Modus bestimmt die **Form des Abfragebereichs**. Er wird im
Einstellungsbereich gewählt (siehe «Einstellungen»). Verfügbare Modi:

- **Punkt** – Abfrage genau am angeklickten Punkt. Im Features-Tab werden hier
  zusätzlich **Koordinaten sowie Terrain- und Oberflächenhöhe (DTM/DOM)** angezeigt.
- **Umkreis** – Rund um den Klickpunkt wird ein **Kreis mit einstellbarem Radius**
  (Standard 500 m) abgefragt. Der Kreis wird auf der Karte gezeichnet und passt sich
  bei Radius-Änderung sofort an.
- **Polygon** – Man **zeichnet ein Polygon** auf der Karte; abgefragt wird alles
  innerhalb. Mit **Escape** bricht man das Zeichnen ab und kehrt zum zuvor aktiven
  Modus (inkl. vorherigem Punkt) zurück; das Panel bleibt dabei offen.
- **Gemeinde** – Ein Klick wählt die **Gemeinde**, in die geklickt wurde; ihr Umriss
  wird hervorgehoben und ihr Name angezeigt.

**Wichtig:** Ein **Moduswechsel behält den bereits gewählten Punkt**. Wechselt man
z. B. von Punkt zu Umkreis, bleibt derselbe Zentrumspunkt bestehen und der Radius
wird darum herum dargestellt.

## Die drei Abfrage-Arten (Tabs)

### Features

- Zeigt die an der Stelle bzw. im Bereich **getroffenen Objekte (Features)** mit ihren
  Sachdaten.
- Ergebnis ist **verschachtelt aufklappbar**: pro **Datensatz** eine Sektion, darin je
  **Layer** eine Untersektion, darin die einzelnen **Features**.
- Mehrere Features eines Layers werden als **nebeneinanderliegende Spalten** dargestellt
  (horizontal scrollbar), mit Zähler (z. B. «1 / 3»).
- Pro Feature gibt es **«Markieren»**: das gewählte Feature wird **auf der Karte farblich
  hervorgehoben**.
- Nur im Modus **Punkt** erscheint zusätzlich die Koordinaten-/Höhen-Angabe.

### Statistik

- Fasst die getroffenen Objekte **je Datensatz statistisch zusammen**.
- Pro Datensatz eine **aufklappbare Sektion** mit einer Tabelle: Zeilen sind die
  Merkmale, Spalten sind die Kennzahlen **Summe · Median · Durchschnitt · Min · Max**.
- Datensätze **ohne statistisch auswertbare Daten** (z. B. «Laufende Bauprojekte»)
  zeigen anstelle einer Tabelle einen **Platzhalter**.
- Es gibt **keine farbliche Hervorhebung** einzelner Werte.

### Datasets

- Zeigt, **welche Datensätze aus dem Kartenkatalog** für den ausgewählten Bereich Daten
  enthalten.
- Die Treffer sind **nach Themen gruppiert und aufklappbar** – analog zum
  Kartenkatalog im linken Panel.
- Über das **Plus** neben einem Datensatz lässt sich dieser **zu den «Aktiven Karten»
  hinzufügen**.
- Oben im Tab steht ein **kurzer, einklappbarer Info-Text**, der den Tab erklärt.
  (Nur der Datasets-Tab hat diesen Info-Text.)

## Einstellungen (Zahnrad)

- Rechts neben den Tabs befindet sich ein **Zahnrad-Button**. Er blendet die
  **Einstellungen ein oder aus**; im offenen Zustand ist er hervorgehoben.
- Die Einstellungen sind **standardmässig ausgeblendet** und umfassen:
  - das **Modus-Dropdown** (Punkt / Umkreis / Polygon / Gemeinde),
  - die **modusabhängigen Felder** (z. B. das **Radius**-Feld beim Umkreis),
  - den Schalter **«Angeschnittene Features»**.

## Angeschnittene Features

- Ein Schalter, der nur bei den **Flächen-Modi** (Umkreis, Polygon, Gemeinde)
  erscheint – beim Modus «Punkt» gibt es ihn nicht.
- **Standardmässig eingeschaltet.** Ist er aktiv, werden **auch Objekte
  berücksichtigt, die vom Rand des Abfragebereichs nur angeschnitten werden**
  (teilweise im Bereich liegen) – nicht nur die vollständig enthaltenen. Ausgeschaltet
  zählen nur vollständig enthaltene Objekte, die Treffermenge ist entsprechend kleiner.
- Neben der Beschriftung erklärt ein **Info-Icon mit Tooltip** die Wirkung.

## Verhalten und Zustände

- **Kombinierbarkeit:** Jede Abfrage-Art lässt sich mit jedem Modus kombinieren.
- **Persistenz:** Gewählte Art, Modus, Radius und der «Angeschnittene Features»-Schalter
  **bleiben über mehrere Abfragen (Klicks) hinweg erhalten**, bis man sie aktiv ändert.
- **Kartendarstellung:** Die Abfrage-Geometrie (Kreis, Polygon, Gemeinde-Umriss) wird
  **echt auf der Karte gezeichnet**; ein Pin markiert das Zentrum.
- **Schliessen:** Der **X**-Button schliesst das Panel und entfernt Pin, Geometrie und
  Feature-Markierung. Das **Info-Werkzeug bleibt aktiv** – ein erneuter Karten-Klick
  öffnet das Panel wieder.
- **Info-Werkzeug erneut anklicken:** öffnet erneut den Flyout zur Wahl der
  Abfrage-Art; die bestehende Abfrage bzw. das Panel bleibt erhalten.

## Verbindung zu «Aktive Karten»

- Die abgefragten Beispiel-Datensätze entsprechen den standardmässig aktiven Karten
  (u. a. Räumliche Bevölkerungsstatistik, Beschäftigtenstatistik, Gebäudestruktur,
  Laufende Bauprojekte).
- Über den Datasets-Tab lassen sich zusätzliche Datensätze in die «Aktiven Karten»
  übernehmen (Plus-Aktion).

## Hinweise

- Es handelt sich um einen **interaktiven Design-Prototyp**: Bedienung, Layout und
  Verhalten sind ausgestaltet, die **Inhalte sind Mock-Daten** (deterministisch je
  Ort erzeugt, kein echter Geodatendienst).
- Der Modus **«Raster» wurde entfernt** und ist nicht mehr Teil der Modus-Auswahl.
