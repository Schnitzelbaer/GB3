import { useState } from "react";
import { ArrowLeft, Check, SlidersHorizontal, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { SearchView } from "@/data/searchIndex";
import type { SearchHit } from "@/types";
import { FilterGroups } from "./FilterGroups";
import { ResultList } from "./ResultList";

interface Props {
  query: string;
  onQueryChange: (q: string) => void;
  onClear: () => void;
  onClose: () => void;
  hasQuery: boolean;
  view: SearchView;
  tokens: string[];
  expanded: Set<string>;
  onToggleExpand: (key: string) => void;
  onToggleFilter: (id: string) => void;
  onResetFilters: () => void;
  activeLayerIds: Set<string>;
  onPick: (hit: SearchHit) => void;
}

/** Full-screen search for small screens: chip bar + filter bottom sheet. */
export function MobileSearch({
  query,
  onQueryChange,
  onClear,
  onClose,
  hasQuery,
  view,
  tokens,
  expanded,
  onToggleExpand,
  onToggleFilter,
  onResetFilters,
  activeLayerIds,
  onPick,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const active = view.effective;
  const nActive = active.size;

  // All filters as chips; active ones first.
  const chips = view.sections.flatMap((s) => s.filters);
  const ordered = [
    ...chips.filter((f) => active.has(f.id)),
    ...chips.filter((f) => !active.has(f.id)),
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* search field */}
      <div className="shrink-0 px-3 pt-3">
        <div className="flex h-12 items-center gap-1 rounded-md border-2 border-zh-blue bg-white px-1">
          <button
            type="button"
            aria-label="Suche schliessen"
            onClick={onClose}
            className="grid size-11 shrink-0 place-items-center rounded-md text-foreground"
          >
            <ArrowLeft className="size-5" />
          </button>
          <input
            autoFocus
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && onClose()}
            aria-label="Suche"
            placeholder="Suchen nach Adressen, Orten, Karten …"
            className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button
              type="button"
              aria-label="Suche leeren"
              onClick={onClear}
              className="grid size-11 shrink-0 place-items-center rounded-md text-muted-foreground"
            >
              <X className="size-5" />
            </button>
          )}
        </div>
      </div>

      {hasQuery && (
        <>
          {/* chip bar */}
          <div className="relative shrink-0 pt-2">
            <div className="flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className={cn(
                  "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold",
                  nActive
                    ? "border-zh-blue bg-zh-blue text-white"
                    : "border-foreground/60 text-foreground",
                )}
              >
                <SlidersHorizontal className="size-4" />
                {nActive ? `Filter · ${nActive}` : "Filter"}
              </button>
              {ordered.map((f) => {
                const on = active.has(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => onToggleFilter(f.id)}
                    className={cn(
                      "inline-flex h-11 max-w-[16rem] shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm",
                      on
                        ? "border-zh-blue/50 bg-zh-blue/10 font-semibold text-zh-blue"
                        : "border-border text-foreground",
                    )}
                  >
                    {on && <Check className="size-4 shrink-0" />}
                    <span className="truncate">{f.label}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {f.count}
                    </span>
                  </button>
                );
              })}
            </div>
            {/* fade instead of a visible scrollbar */}
            <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white to-transparent" />
          </div>

          {/* result count */}
          <div className="flex min-h-11 shrink-0 items-center justify-between border-b border-border px-4">
            <p role="status" className="text-sm text-muted-foreground">
              {view.total} Treffer
            </p>
            {nActive > 0 && (
              <button
                type="button"
                onClick={onResetFilters}
                className="min-h-11 text-sm font-semibold text-zh-blue"
              >
                Zurücksetzen
              </button>
            )}
          </div>

          {/* results */}
          <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-1 pb-4">
            <ResultList
              groups={view.groups}
              tokens={tokens}
              expanded={expanded}
              onToggleExpand={onToggleExpand}
              cursor={-1}
              mobile
              activeLayerIds={activeLayerIds}
              onPick={onPick}
              onHover={() => {}}
            />
          </div>
        </>
      )}

      {/* filter bottom sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSheetOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="search-filter-title"
            className="relative flex max-h-[85%] flex-col rounded-t-2xl bg-white shadow-xl"
          >
            <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-zinc-300" />
            <div className="flex shrink-0 items-center justify-between px-4 pt-2">
              <h2 id="search-filter-title" className="text-lg font-semibold">
                Filter
              </h2>
              <button
                type="button"
                aria-label="Filter schliessen"
                onClick={() => setSheetOpen(false)}
                className="grid size-11 place-items-center rounded-md"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-2 pb-3">
              <FilterGroups
                sections={view.sections}
                active={active}
                onToggle={onToggleFilter}
                touch
              />
            </div>
            <div className="grid shrink-0 grid-cols-[auto_1fr] gap-3 border-t border-border p-4">
              <button
                type="button"
                onClick={onResetFilters}
                className="h-12 rounded-md border border-zh-blue px-4 text-sm font-semibold text-zh-blue"
              >
                Zurücksetzen
              </button>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="h-12 rounded-md bg-zh-blue px-4 text-sm font-semibold text-white hover:bg-zh-blue-hover"
              >
                {view.total} Treffer anzeigen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
