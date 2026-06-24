import { useState } from "react";
import {
  X,
  Printer,
  ChevronDown,
  ChevronRight,
  Info as InfoIcon,
  Layers,
  MapPin,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { CatalogMapRow } from "./catalog/CatalogMapRow";
import { StatistikView } from "./info/StatistikView";
import { formatLv95 } from "@/lib/swissProjection";
import type {
  DatasetHit,
  FeaturesResult,
  IdentifyDataset,
  IdentifyFeature,
  IdentifyLayer,
  InfoQueryState,
  QueryMode,
  QueryTab,
  StatBlock,
} from "@/types";

const TABS: { id: QueryTab; label: string }[] = [
  { id: "features", label: "Features" },
  { id: "statistik", label: "Statistik" },
  { id: "datasets", label: "Datasets" },
];

const MODES: { id: QueryMode; label: string }[] = [
  { id: "punkt", label: "Punkt" },
  { id: "raster", label: "Raster" },
  { id: "umkreis", label: "Umkreis" },
  { id: "polygon", label: "Polygon" },
  { id: "gemeinde", label: "Gemeinde" },
];

interface InfoPanelProps {
  query: InfoQueryState;
  features: FeaturesResult | null;
  datasets: DatasetHit[] | null;
  statistik: StatBlock[] | null;
  activeLayerIds: Set<string>;
  onClose: () => void;
  onChangeTab: (tab: QueryTab) => void;
  onChangeMode: (mode: QueryMode) => void;
  onChangeRadius: (m: number) => void;
  onChangeGrid: (n: number) => void;
  onSetMarked: (featureId: string | null) => void;
  onAddMap: (id: string, title: string) => void;
}

/* ------------------------------ small bits ------------------------------ */

function BlackInfo() {
  return (
    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-foreground text-background">
      <InfoIcon className="size-3" />
    </span>
  );
}

function NumberField({
  label,
  value,
  suffix,
  min,
  onChange,
}: {
  label: string;
  value: number;
  suffix: string;
  min: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex h-12 shrink-0 items-center gap-1.5 rounded-md border border-input bg-background px-3">
      <div className="flex flex-col">
        <span className="text-[10px] font-semibold uppercase leading-none tracking-wide text-muted-foreground">
          {label}
        </span>
        <input
          type="number"
          min={min}
          value={value}
          onChange={(e) => onChange(Math.max(min, Number(e.target.value) || min))}
          className="w-14 bg-transparent text-sm leading-tight outline-none"
        />
      </div>
      <span className="text-sm text-muted-foreground">{suffix}</span>
    </div>
  );
}

function FeatureTable({
  features,
  markedId,
  onMark,
}: {
  features: IdentifyFeature[];
  markedId: string | null;
  onMark: (id: string | null) => void;
}) {
  if (features.length === 0) return null;
  const labels = features[0].attributes.map((a) => a.label);

  return (
    <div className="scrollbar-thin overflow-x-auto rounded-sm border border-border">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 w-[42%] min-w-[130px] bg-white" />
            {features.map((f, i) => {
              const marked = markedId === f.id;
              return (
                <th
                  key={f.id}
                  className="min-w-[190px] border-l border-border bg-white px-3 py-1.5 align-top font-normal"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold tabular-nums">
                      {i + 1}/{features.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => onMark(marked ? null : f.id)}
                      className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                      title="Feature auf der Karte markieren"
                    >
                      Markieren:
                      <span
                        className={cn(
                          "grid size-4 place-items-center rounded-full border",
                          marked ? "border-zh-blue" : "border-zinc-400",
                        )}
                      >
                        {marked && (
                          <span className="size-2 rounded-full bg-zh-blue" />
                        )}
                      </span>
                    </button>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {labels.map((label, ri) => {
            const zebra = ri % 2 === 0 ? "bg-zinc-50" : "bg-white";
            return (
              <tr key={label} className={zebra}>
                <td
                  className={cn(
                    "sticky left-0 z-10 truncate px-3 py-1.5 font-medium text-zinc-700",
                    zebra,
                  )}
                  title={label}
                >
                  {label}
                </td>
                {features.map((f) => (
                  <td
                    key={f.id}
                    className="border-l border-border px-3 py-1.5 align-top"
                  >
                    {f.attributes[ri]?.value}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function LayerSection({
  layer,
  markedId,
  onMark,
}: {
  layer: IdentifyLayer;
  markedId: string | null;
  onMark: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(true);
  const Chevron = open ? ChevronDown : ChevronRight;
  return (
    <div>
      <div className="flex items-center gap-2 py-1.5">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="text-zinc-500 hover:text-foreground"
        >
          <Chevron className="size-4" />
        </button>
        <Layers className="size-5 shrink-0 text-zinc-600" />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold" title={layer.title}>
          {layer.title}
        </span>
        <button type="button" title="Informationen zum Layer">
          <BlackInfo />
        </button>
      </div>
      {open && (
        <div className="pb-1 pl-6">
          <FeatureTable features={layer.features} markedId={markedId} onMark={onMark} />
        </div>
      )}
    </div>
  );
}

function DatasetSection({
  dataset,
  markedId,
  onMark,
}: {
  dataset: IdentifyDataset;
  markedId: string | null;
  onMark: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(true);
  const Chevron = open ? ChevronDown : ChevronRight;
  return (
    <div className="py-1">
      <div className="flex items-center gap-2 rounded bg-muted px-2 py-1.5">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="text-zinc-500 hover:text-foreground"
        >
          <Chevron className="size-4" />
        </button>
        <span
          className="size-6 shrink-0 rounded-sm ring-1 ring-black/10"
          style={{
            backgroundImage:
              "linear-gradient(135deg,#c940b2 0%,#f39237 50%,#78be5a 100%)",
          }}
        />
        <span className="min-w-0 flex-1 truncate text-[15px] font-bold" title={dataset.title}>
          {dataset.title}
        </span>
        <button type="button" title="Informationen zum Datensatz">
          <BlackInfo />
        </button>
      </div>
      {open && (
        <div className="space-y-1 pb-1 pl-5 pt-1">
          {dataset.layers.map((layer) => (
            <LayerSection
              key={layer.id}
              layer={layer}
              markedId={markedId}
              onMark={onMark}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{children}</p>;
}

/* -------------------------------- panel --------------------------------- */

export function InfoPanel({
  query,
  features,
  datasets,
  statistik,
  activeLayerIds,
  onClose,
  onChangeTab,
  onChangeMode,
  onChangeRadius,
  onChangeGrid,
  onSetMarked,
  onAddMap,
}: InfoPanelProps) {
  const [coordsOpen, setCoordsOpen] = useState(true);
  const CoordChevron = coordsOpen ? ChevronDown : ChevronRight;
  const hasQuery = query.geometry !== null;

  return (
    <div className="animate-panel-in flex h-full flex-col border-l border-border bg-white">
      {/* header */}
      <div className="flex items-center justify-between px-5 pb-1 pt-4">
        <h2 className="text-3xl font-bold tracking-tight">Info</h2>
        <button
          type="button"
          onClick={onClose}
          title="Schliessen"
          className="grid size-9 place-items-center rounded-md text-zinc-600 hover:bg-muted"
        >
          <X className="size-6" />
        </button>
      </div>

      {/* tabs + mode */}
      <div className="space-y-2.5 px-4 pb-3 pt-1">
        <Tabs value={query.tab} onValueChange={(v) => onChangeTab(v as QueryTab)}>
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t.id} value={t.id}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex items-stretch gap-2">
          <Select
            value={query.mode}
            onValueChange={(v) => onChangeMode(v as QueryMode)}
          >
            <SelectTrigger className="h-12 flex-1">
              <div className="flex flex-col items-start text-left">
                <span className="text-[10px] font-semibold uppercase leading-none tracking-wide text-muted-foreground">
                  Modus
                </span>
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {MODES.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {query.mode === "umkreis" && (
            <NumberField
              label="Radius"
              value={query.radiusM}
              suffix="m"
              min={1}
              onChange={onChangeRadius}
            />
          )}
          {query.mode === "raster" && (
            <NumberField
              label="Anzahl"
              value={query.gridCount}
              suffix="× 100 m"
              min={1}
              onChange={onChangeGrid}
            />
          )}
        </div>
      </div>

      {/* content */}
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto border-t border-border px-4">
        {query.geometry?.kind === "gemeinde" && (
          <div className="flex items-center gap-2 border-b border-border py-2.5 text-sm">
            <MapPin className="size-4 shrink-0 text-zh-blue" />
            <span>
              <span className="font-semibold">Gemeinde:</span>{" "}
              {query.geometry.name}
            </span>
          </div>
        )}

        {query.tab === "features" && (
          <>
            {query.mode === "punkt" && features && (
              <div className="flex items-start gap-2 py-3">
                <button
                  type="button"
                  onClick={() => setCoordsOpen((o) => !o)}
                  className="mt-0.5 text-zinc-500 hover:text-foreground"
                >
                  <CoordChevron className="size-4" />
                </button>
                {coordsOpen && (
                  <div className="text-[13px] leading-relaxed">
                    <div>
                      <span className="font-bold">Koordinaten:</span>{" "}
                      <span className="tabular-nums">
                        {formatLv95(features.coordinate)}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold">DTM:</span>{" "}
                      <span className="tabular-nums">
                        {features.dtm.toFixed(2)} m
                      </span>{" "}
                      / <span className="font-bold">DOM:</span>{" "}
                      <span className="tabular-nums">
                        {features.dom.toFixed(2)} m
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!hasQuery && (
              <EmptyHint>
                Klicken Sie in die Karte, um Features abzufragen.
              </EmptyHint>
            )}

            {features && (
              <div className={cn(query.mode === "punkt" && "border-t border-border")}>
                {features.datasets.map((ds) => (
                  <DatasetSection
                    key={ds.id}
                    dataset={ds}
                    markedId={query.markedFeatureId}
                    onMark={onSetMarked}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {query.tab === "datasets" && (
          <div className="py-2">
            {!hasQuery && (
              <EmptyHint>
                Klicken Sie in die Karte, um vorhandene Datensätze aufzuspüren.
              </EmptyHint>
            )}
            {datasets && (
              <div className="divide-y divide-border">
                {datasets.map((d) => (
                  <CatalogMapRow
                    key={d.id}
                    id={d.id}
                    title={d.title}
                    isActive={activeLayerIds.has(d.id)}
                    onAdd={() => onAddMap(d.id, d.title)}
                    hitCount={d.hitCount}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {query.tab === "statistik" && (
          <>
            {!hasQuery && (
              <EmptyHint>
                Klicken Sie in die Karte, um die Statistik abzufragen.
              </EmptyHint>
            )}
            {statistik && <StatistikView blocks={statistik} />}
          </>
        )}
      </div>

      {/* footer */}
      <div className="border-t border-border p-3">
        <Button
          variant="secondary"
          className="h-11 w-full gap-2 text-base"
          onClick={() => window.print()}
        >
          <Printer className="size-5" />
          Info drucken
        </Button>
      </div>
    </div>
  );
}
