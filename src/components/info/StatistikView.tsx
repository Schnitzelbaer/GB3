import { BarChart3 } from "lucide-react";

import { DatasetDisclosure } from "./DatasetDisclosure";
import { STAT_COLUMNS } from "@/data/statistik";
import type { StatBlock, StatRow } from "@/types";

function Row({ row }: { row: StatRow }) {
  return (
    <tr className="border-b border-border">
      <td className="px-2 py-1 text-left text-zinc-700">{row.label}</td>
      {row.cells.map((c, i) => (
        <td
          key={i}
          className="whitespace-nowrap border-l border-border px-2 py-1 text-right tabular-nums"
        >
          {c.value}
        </td>
      ))}
    </tr>
  );
}

function Block({ block }: { block: StatBlock }) {
  return (
    <DatasetDisclosure title={block.title}>
      {block.placeholder ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <BarChart3 className="size-8 text-zinc-300" />
          <p className="max-w-[16rem] text-sm text-muted-foreground">
            Für diesen Layer sind keine Statistikdaten verfügbar.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-muted">
                  <th className="px-2 py-1.5" />
                  {STAT_COLUMNS.map((c) => (
                    <th
                      key={c}
                      className="whitespace-nowrap border-l border-border px-2 py-1.5 text-right font-semibold"
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, ri) => (
                  <Row key={ri} row={row} />
                ))}
              </tbody>
            </table>
          </div>

          {block.definition && (
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">Definitionen:</span>{" "}
              {block.definition}
            </p>
          )}
          {block.source && (
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">Quelle:</span>{" "}
              {block.source}
            </p>
          )}
        </>
      )}
    </DatasetDisclosure>
  );
}

export function StatistikView({ blocks }: { blocks: StatBlock[] }) {
  return (
    <div className="py-1">
      {blocks.map((b) => (
        <Block key={b.id} block={b} />
      ))}
    </div>
  );
}
