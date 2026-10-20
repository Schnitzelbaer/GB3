import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useMapInstance } from "@/lib/mapContext";
import { useIsMobile } from "@/lib/useIsMobile";
import {
  buildView,
  isQueryValid,
  search,
  tokenize,
} from "@/data/searchIndex";
import type { ActiveLayer, SearchHit } from "@/types";
import { FilterGroups } from "./FilterGroups";
import { MobileSearch } from "./MobileSearch";
import { ResultList, visibleHits } from "./ResultList";
import { useSearchMarker } from "./useSearchMarker";

interface SearchBoxProps {
  activeLayers: ActiveLayer[];
  onAddMap: (id: string, title: string) => void;
}

function toggled(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

export function SearchBox({ activeLayers, onAddMap }: SearchBoxProps) {
  const map = useMapInstance();
  const isMobile = useIsMobile();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false); // desktop panel
  const [mobileOpen, setMobileOpen] = useState(false);
  const [filters, setFilters] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [cursor, setCursor] = useState(-1);
  const [hovered, setHovered] = useState<SearchHit | null>(null);
  const [pinned, setPinned] = useState<SearchHit | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const hasQuery = isQueryValid(query);
  const tokens = useMemo(() => tokenize(query), [query]);
  const hits = useMemo(() => search(query), [query]);
  const activeMaps = useMemo(
    () => activeLayers.map((l) => ({ id: l.id, title: l.title })),
    [activeLayers],
  );
  const activeLayerIds = useMemo(
    () => new Set(activeLayers.map((l) => l.id)),
    [activeLayers],
  );
  const view = useMemo(
    () => buildView(hits, activeMaps, filters),
    [hits, activeMaps, filters],
  );
  const flat = useMemo(
    () => visibleHits(view.groups, expanded),
    [view.groups, expanded],
  );
  const panelOpen = open && hasQuery && !isMobile;

  // Keyboard cursor and hover reset whenever the list changes.
  useEffect(() => {
    setCursor(-1);
    setHovered(null);
  }, [query, filters, expanded]);

  /* ------------------------------ map marker ------------------------------ */
  const showMarker = useSearchMarker(map);
  const preview = panelOpen
    ? ([hovered, flat[cursor]].find((h) => h?.coordinate && flat.includes(h)) ?? null)
    : null;
  // No marker in the empty state; otherwise the preview wins over the pin.
  const markerHit = preview ?? (panelOpen && view.total === 0 ? null : pinned);
  useEffect(() => showMarker(markerHit), [showMarker, markerHit]);

  // Bring a previewed hit into the map area left of the panel if it is not
  // visible there (pan only, no zoom; debounced while moving over the list).
  useEffect(() => {
    const coord = preview?.coordinate;
    if (!coord || !map || !rootRef.current) return;
    const timer = window.setTimeout(() => {
      const view = map.getView();
      const size = map.getSize();
      const res = view.getResolution();
      const target = map.getTargetElement();
      if (!size || !res || !target || !rootRef.current) return;
      const freeW =
        rootRef.current.getBoundingClientRect().left -
        target.getBoundingClientRect().left;
      if (freeW < 160) return;
      const px = map.getPixelFromCoordinate(coord);
      const m = 40;
      if (px && px[0] > m && px[0] < freeW - m && px[1] > m && px[1] < size[1] - m)
        return;
      view.animate({
        center: [
          coord[0] + (size[0] / 2 - freeW / 2) * res,
          coord[1],
        ],
        duration: 400,
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [preview, map]);

  /* -------------------------------- actions ------------------------------- */
  const close = useCallback(() => {
    setOpen(false);
    setHovered(null);
    inputRef.current?.blur();
  }, []);

  const pick = useCallback(
    (hit: SearchHit) => {
      if (hit.type === "karte") {
        if (hit.catalogId && !activeLayerIds.has(hit.catalogId))
          onAddMap(hit.catalogId, hit.title);
        return;
      }
      if (map && hit.coordinate)
        map.getView().animate({
          center: hit.coordinate,
          resolution: hit.resolution ?? 1,
          duration: 650,
        });
      setPinned(hit);
      setMobileOpen(false);
      close();
    },
    [map, activeLayerIds, onAddMap, close],
  );

  const changeQuery = (value: string) => {
    setQuery(value);
    setPinned(null);
    setExpanded(new Set());
    setOpen(true);
  };
  const clear = () => {
    setQuery("");
    setPinned(null);
    setExpanded(new Set());
    inputRef.current?.focus();
  };
  const toggleFilter = (id: string) => setFilters((f) => toggled(f, id));
  const resetFilters = () => setFilters(new Set());
  const toggleExpand = (key: string) => setExpanded((e) => toggled(e, key));

  // Desktop: click outside closes. A click on the map only dismisses the
  // search and does not also trigger a map query.
  useEffect(() => {
    if (!panelOpen) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (!target || rootRef.current?.contains(target)) return;
      setOpen(false);
      setHovered(null);
      if (target.closest(".ol-viewport")) e.stopPropagation();
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [panelOpen]);

  // Keep the keyboard cursor in view.
  useEffect(() => {
    if (cursor < 0) return;
    listRef.current
      ?.querySelector(`[data-hit-index="${cursor}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      close();
      return;
    }
    if (!panelOpen || !flat.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(flat.length - 1, c + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(-1, c - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(flat[Math.max(cursor, 0)]);
    }
  };

  /* -------------------------------- render -------------------------------- */
  if (isMobile)
    return createPortal(
      mobileOpen ? (
        <MobileSearch
          query={query}
          onQueryChange={changeQuery}
          onClear={() => {
            setQuery("");
            setPinned(null);
            setExpanded(new Set());
          }}
          onClose={() => setMobileOpen(false)}
          hasQuery={hasQuery}
          view={view}
          tokens={tokens}
          expanded={expanded}
          onToggleExpand={toggleExpand}
          onToggleFilter={toggleFilter}
          onResetFilters={resetFilters}
          activeLayerIds={activeLayerIds}
          onPick={pick}
        />
      ) : (
        // The rest of the prototype is desktop-only, so on small screens the
        // search gets its own fixed bar that opens the full-screen search.
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="fixed inset-x-3 top-[4.25rem] z-40 flex h-12 items-center gap-2 rounded-md border border-black/10 bg-white px-3 text-left text-sm shadow-md"
        >
          <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          <span className={cn("truncate", !query && "text-muted-foreground")}>
            {query || "Suchen nach Adressen, Orten, Karten …"}
          </span>
        </button>
      ),
      document.body,
    );

  return (
    <>
      <div
        ref={rootRef}
        onKeyDown={(e) => {
          if (e.key === "Escape" && panelOpen) close();
        }}
        className={cn(
          "pointer-events-auto flex w-full flex-col",
          panelOpen
            ? "h-full max-w-[760px] overflow-hidden rounded-md border border-black/10 bg-white shadow-lg"
            : "max-w-[min(640px,calc(100%-8rem))]",
        )}
      >
        <div className={cn(panelOpen && "shrink-0 px-3 pb-2 pt-3")}>
          <div
            className={cn(
              "flex h-11 items-center gap-2 rounded-md border bg-white px-3",
              panelOpen
                ? "border-zh-blue ring-1 ring-zh-blue"
                : "border-black/10 shadow-md",
            )}
          >
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <input
              ref={inputRef}
              value={query}
              role="combobox"
              aria-label="Suche"
              aria-expanded={panelOpen}
              aria-controls="search-results"
              aria-autocomplete="list"
              aria-activedescendant={cursor >= 0 ? `search-hit-${cursor}` : undefined}
              onChange={(e) => changeQuery(e.target.value)}
              onFocus={() => setOpen(true)}
              onKeyDown={onKeyDown}
              placeholder="Suchen nach Adressen, Orten, Karten und mehr …"
              className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button
                type="button"
                aria-label="Suche leeren"
                onClick={clear}
                className="grid size-7 shrink-0 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          {panelOpen && (
            <p role="status" className="mt-1.5 px-1 text-xs text-muted-foreground">
              {view.total} Treffer
            </p>
          )}
        </div>

        {panelOpen && (
          <div className="flex min-h-0 flex-1 border-t border-border">
            <aside
              aria-label="Filter"
              className="scrollbar-thin w-[248px] shrink-0 overflow-y-auto overflow-x-hidden border-r border-border px-2 pb-3"
            >
              <div className="flex items-center justify-between px-2 pt-3">
                <h2 className="text-[15px] font-semibold">Filter</h2>
                <button
                  type="button"
                  disabled={view.effective.size === 0}
                  onClick={resetFilters}
                  className="text-sm font-medium text-zh-blue hover:underline disabled:cursor-default disabled:text-muted-foreground disabled:no-underline"
                >
                  Zurücksetzen
                </button>
              </div>
              <FilterGroups
                sections={view.sections}
                active={view.effective}
                onToggle={toggleFilter}
              />
            </aside>
            <div
              ref={listRef}
              id="search-results"
              className="scrollbar-thin min-w-0 flex-1 overflow-y-auto px-2 pb-3"
            >
              <ResultList
                groups={view.groups}
                tokens={tokens}
                expanded={expanded}
                onToggleExpand={toggleExpand}
                cursor={cursor}
                activeLayerIds={activeLayerIds}
                onPick={pick}
                onHover={setHovered}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
