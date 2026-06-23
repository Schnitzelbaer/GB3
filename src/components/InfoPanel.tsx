import { useState } from "react";
import {
  X,
  Printer,
  ChevronDown,
  ChevronRight,
  Info as InfoIcon,
  Layers,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { formatLv95 } from "@/lib/swissProjection";
import type {
  IdentifyResult,
  IdentifySection,
  IdentifyRecord,
} from "@/types";

function SectionThumb({ kind }: { kind: IdentifySection["kind"] }) {
  if (kind === "map") {
    return (
      <span
        className="size-6 shrink-0 rounded-sm ring-1 ring-black/10"
        style={{
          backgroundImage:
            "linear-gradient(135deg,#c940b2 0%,#f39237 50%,#78be5a 100%)",
        }}
      />
    );
  }
  return <Layers className="size-5 shrink-0 text-zinc-600" />;
}

function RecordTable({ record }: { record: IdentifyRecord }) {
  return (
    <div className="overflow-hidden rounded-sm border border-border">
      <div className="flex items-center justify-between bg-white px-3 py-1.5 text-xs">
        <span className="font-semibold tabular-nums">
          {record.index}/{record.total}
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          Markieren:
          <span className="grid size-4 place-items-center rounded-full border border-zinc-400" />
        </span>
      </div>
      <div>
        {record.attributes.map((attr, i) => (
          <div
            key={attr.label}
            className={cn(
              "grid grid-cols-[40%_1fr] text-[13px]",
              i % 2 === 0 ? "bg-zinc-50" : "bg-white",
            )}
          >
            <div
              className="truncate px-3 py-1.5 font-medium text-zinc-700"
              title={attr.label}
            >
              {attr.label}
            </div>
            <div className="border-l border-border px-3 py-1.5">
              {attr.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Section({ section }: { section: IdentifySection }) {
  const [open, setOpen] = useState(true);
  const Chevron = open ? ChevronDown : ChevronRight;

  return (
    <div>
      <div className="flex items-center gap-2 py-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="text-zinc-500 hover:text-foreground"
        >
          <Chevron className="size-4" />
        </button>
        <SectionThumb kind={section.kind} />
        <span
          className="min-w-0 flex-1 truncate text-[15px] font-bold"
          title={section.title}
        >
          {section.title}
        </span>
        <button
          type="button"
          title="Informationen zur Karte"
          className="text-zinc-500 hover:text-foreground"
        >
          <InfoIcon className="size-4" />
        </button>
      </div>
      {open && section.records.length > 0 && (
        <div className="space-y-3 pb-2 pl-6">
          {section.records.map((rec, i) => (
            <RecordTable key={i} record={rec} />
          ))}
        </div>
      )}
    </div>
  );
}

export function InfoPanel({
  result,
  onClose,
}: {
  result: IdentifyResult;
  onClose: () => void;
}) {
  const [coordsOpen, setCoordsOpen] = useState(true);
  const CoordChevron = coordsOpen ? ChevronDown : ChevronRight;

  return (
    <div className="animate-panel-in flex h-full flex-col bg-white">
      {/* header */}
      <div className="flex items-center justify-between px-5 pb-2 pt-4">
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

      {/* coordinates */}
      <div className="flex items-start gap-2 px-5 pb-3">
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
                {formatLv95(result.coordinate)}
              </span>
            </div>
            <div>
              <span className="font-bold">DTM:</span>{" "}
              <span className="tabular-nums">{result.dtm.toFixed(2)} m</span>
              {"  "}/ <span className="font-bold">DOM:</span>{" "}
              <span className="tabular-nums">{result.dom.toFixed(2)} m</span>
            </div>
          </div>
        )}
      </div>

      {/* sections */}
      <div className="scrollbar-thin min-h-0 flex-1 divide-y divide-border overflow-y-auto border-t border-border px-5">
        {result.sections.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            An dieser Stelle wurden keine Objekte der aktiven Karten gefunden.
            Klicken Sie auf eine farbige Naturschutzfläche, um Sachdaten
            anzuzeigen.
          </p>
        ) : (
          result.sections.map((section) => (
            <Section key={section.id} section={section} />
          ))
        )}
      </div>

      {/* footer */}
      <div className="border-t border-border p-3">
        <Button
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
