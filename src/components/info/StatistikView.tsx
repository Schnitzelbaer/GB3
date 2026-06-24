import { cn } from "@/lib/utils";
import type { StatBlock, StatCell, StatRow } from "@/types";

const TONE_BG: Record<string, string> = {
  low: "bg-red-100",
  high: "bg-green-100",
  mid: "",
};

function ValueCell({ cell, last }: { cell: StatCell; last?: boolean }) {
  return (
    <td
      className={cn(
        "border-l border-zh-blue/20 px-2 py-1 text-right tabular-nums",
        last && "font-medium",
        cell.tone && TONE_BG[cell.tone],
      )}
    >
      {cell.value}
    </td>
  );
}

function Row({ row }: { row: StatRow }) {
  return (
    <tr className="border-b border-border">
      <td
        className={cn(
          "px-2 py-1 text-left",
          row.strong ? "font-semibold" : "text-zinc-700",
        )}
      >
        {row.label}
      </td>
      {row.cells.map((c, i) => (
        <ValueCell key={i} cell={c} last={i === row.cells.length - 1} />
      ))}
      <td className="border-l border-border px-2 py-1 text-left text-muted-foreground">
        {row.unit}
      </td>
    </tr>
  );
}

function Block({ block }: { block: StatBlock }) {
  const span = block.columns.length + 2; // label + values + unit
  return (
    <div className="py-4">
      <h3 className="text-[15px] font-bold leading-tight">{block.title}</h3>
      <p className="mb-2 text-xs text-muted-foreground">{block.date}</p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-muted">
              <th className="px-2 py-1.5" />
              {block.columns.map((c) => (
                <th
                  key={c}
                  className="border-l border-zh-blue/20 px-2 py-1.5 text-right font-semibold"
                >
                  {c}
                </th>
              ))}
              <th className="border-l border-border px-2 py-1.5" />
            </tr>
          </thead>
          <tbody>
            {block.sections.map((section, si) => (
              <SectionRows key={si} title={section.title} span={span}>
                {section.rows.map((row, ri) => (
                  <Row key={ri} row={row} />
                ))}
              </SectionRows>
            ))}
          </tbody>
        </table>
      </div>

      {block.colorLegend && <ColorLegend />}

      {block.definition && (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">Definitionen:</span>{" "}
          {block.definition}
        </p>
      )}
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground">Quelle:</span>{" "}
        {block.source}
      </p>
    </div>
  );
}

function SectionRows({
  title,
  span,
  children,
}: {
  title?: string;
  span: number;
  children: React.ReactNode;
}) {
  return (
    <>
      {title && (
        <tr>
          <td
            colSpan={span}
            className="border-b-2 border-zh-blue/70 px-2 pb-1 pt-3 text-[13px] font-bold"
          >
            {title}
          </td>
        </tr>
      )}
      {children}
    </>
  );
}

function ColorLegend() {
  return (
    <div className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
      <span className="font-semibold">Farbe:</span>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="size-3.5 shrink-0 rounded-sm bg-red-100 ring-1 ring-red-200" />
          Wert <span className="font-semibold">unter</span>durchschnittlich
        </div>
        <div className="flex items-center gap-2">
          <span className="size-3.5 shrink-0 rounded-sm bg-white ring-1 ring-border" />
          Wert <span className="font-semibold">ähnlich</span> wie der kantonale
          Durchschnitt (±5 %)
        </div>
        <div className="flex items-center gap-2">
          <span className="size-3.5 shrink-0 rounded-sm bg-green-100 ring-1 ring-green-200" />
          Wert <span className="font-semibold">über</span>durchschnittlich
        </div>
      </div>
    </div>
  );
}

export function StatistikView({ blocks }: { blocks: StatBlock[] }) {
  return (
    <div className="divide-y divide-border">
      {blocks.map((b) => (
        <Block key={b.id} block={b} />
      ))}
    </div>
  );
}
