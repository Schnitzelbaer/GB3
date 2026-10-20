import { Fragment } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Hash,
  House,
  MapPin,
  Pentagon,
  Plus,
  SearchX,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { highlight, type ResultGroup } from "@/data/searchIndex";
import { MapThumb } from "@/components/catalog/CatalogMapRow";
import type { SearchHit, SearchHitType } from "@/types";

/** Hits shown per group before the accordion is opened. */
export const COLLAPSED = 3;
/** Upper bound of rows rendered for an expanded group. */
export const EXPANDED_CAP = 100;

/** The hits currently rendered, in list order (for keyboard navigation). */
export function visibleHits(groups: ResultGroup[], expanded: Set<string>) {
  return groups.flatMap((gr) =>
    gr.hits.slice(0, expanded.has(gr.key) ? EXPANDED_CAP : COLLAPSED),
  );
}

const ICONS: Record<Exclude<SearchHitType, "karte">, typeof MapPin> = {
  adresse: MapPin,
  ort: House,
  gvz: Hash,
  parzelle: Hash,
  egrid: Hash,
  egid: Hash,
  objekt: Pentagon,
};

function Hl({ text, tokens }: { text: string; tokens: string[] }) {
  return (
    <>
      {highlight(text, tokens).map((s, i) =>
        s.match ? (
          <strong key={i} className="font-bold text-foreground">
            {s.text}
          </strong>
        ) : (
          <Fragment key={i}>{s.text}</Fragment>
        ),
      )}
    </>
  );
}

function Subtitle({
  hit,
  tokens,
  mapActive,
}: {
  hit: SearchHit;
  tokens: string[];
  mapActive: boolean;
}) {
  const parts: React.ReactNode[] = [hit.label];
  if (hit.value) parts.push(<Hl text={hit.value} tokens={tokens} />);
  if (hit.context) parts.push(hit.context);
  if (hit.tags) parts.push(...hit.tags);
  if (mapActive) parts.push("Bereits aktiv");
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>
          {i > 0 && " • "}
          {p}
        </Fragment>
      ))}
    </>
  );
}

function Leading({
  hit,
  mobile,
  mapActive,
}: {
  hit: SearchHit;
  mobile: boolean;
  mapActive: boolean;
}) {
  if (hit.type === "karte")
    return (
      <span className="grid size-10 shrink-0 place-items-center">
        <MapThumb
          id={hit.catalogId ?? hit.id}
          badge={mobile ? "none" : mapActive ? "check" : "add"}
        />
      </span>
    );
  const Icon = ICONS[hit.type];
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-md bg-muted text-foreground">
      <Icon
        className={cn("size-5", hit.type === "objekt" && "fill-current")}
        aria-hidden
      />
    </span>
  );
}

interface RowProps {
  hit: SearchHit;
  index: number;
  tokens: string[];
  selected: boolean;
  mobile: boolean;
  mapActive: boolean;
  onPick: (hit: SearchHit) => void;
  onHover: (hit: SearchHit | null) => void;
}

function Row({ hit, index, tokens, selected, mobile, mapActive, onPick, onHover }: RowProps) {
  const body = (
    <>
      <Leading hit={hit} mobile={mobile} mapActive={mapActive} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-foreground">
          <Hl text={hit.title} tokens={tokens} />
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          <Subtitle hit={hit} tokens={tokens} mapActive={mapActive} />
        </span>
      </span>
    </>
  );
  const base = "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left";

  // Mobile catalog maps: separate 44 px add button (no nested buttons).
  if (mobile && hit.type === "karte")
    return (
      <div data-hit-index={index} className={base}>
        {body}
        <button
          type="button"
          aria-label="Karte hinzufügen"
          disabled={mapActive}
          onClick={() => onPick(hit)}
          className="grid size-11 shrink-0 place-items-center rounded-md border border-zh-blue/60 text-zh-blue disabled:border-border disabled:text-muted-foreground"
        >
          {mapActive ? <Check className="size-5" /> : <Plus className="size-5" />}
        </button>
      </div>
    );

  return (
    <button
      type="button"
      id={`search-hit-${index}`}
      data-hit-index={index}
      disabled={hit.type === "karte" && mapActive}
      onClick={() => onPick(hit)}
      onMouseEnter={() => onHover(hit)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(hit)}
      onBlur={() => onHover(null)}
      className={cn(
        base,
        "transition-colors hover:bg-zh-blue/[0.07] focus-visible:bg-zh-blue/[0.07] focus-visible:outline-none",
        "disabled:cursor-default disabled:hover:bg-transparent",
        selected && "bg-zh-blue/[0.07]",
        mobile && "min-h-14",
      )}
    >
      {body}
    </button>
  );
}

function Group({
  group,
  expanded,
  onToggle,
  startIndex,
  cursor,
  activeLayerIds,
  tokens,
  mobile,
  onPick,
  onHover,
}: {
  group: ResultGroup;
  expanded: boolean;
  onToggle: () => void;
  startIndex: number;
  cursor: number;
  activeLayerIds: Set<string>;
  tokens: string[];
  mobile: boolean;
  onPick: (hit: SearchHit) => void;
  onHover: (hit: SearchHit | null) => void;
}) {
  const n = group.hits.length;
  const shown = group.hits.slice(0, expanded ? EXPANDED_CAP : COLLAPSED);
  const headingId = `search-group-${group.key}`;
  return (
    <section aria-labelledby={headingId} className="pb-1">
      <h3
        id={headingId}
        className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-foreground/75"
      >
        {group.title}
        <span className="ml-1.5 font-medium text-muted-foreground">{n}</span>
      </h3>
      {shown.map((hit, i) => (
        <Row
          key={hit.id}
          hit={hit}
          index={startIndex + i}
          selected={cursor === startIndex + i}
          mapActive={!!hit.catalogId && activeLayerIds.has(hit.catalogId)}
          tokens={tokens}
          mobile={mobile}
          onPick={onPick}
          onHover={onHover}
        />
      ))}
      {n > COLLAPSED && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={onToggle}
          className={cn(
            "ml-[3.25rem] flex items-center gap-1 rounded-md px-3 text-sm font-semibold text-zh-blue hover:underline",
            mobile ? "min-h-11" : "py-2",
          )}
        >
          {expanded ? "Weniger anzeigen" : `Alle ${n} ${group.plural} anzeigen`}
          {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
      )}
      {expanded && n > EXPANDED_CAP && (
        <p className="pb-2 pl-16 text-xs text-muted-foreground">
          {n - EXPANDED_CAP} weitere Treffer – Suchbegriff verfeinern
        </p>
      )}
    </section>
  );
}

export function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 pt-16 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
        <SearchX className="size-6" aria-hidden />
      </span>
      <p className="text-sm font-semibold text-muted-foreground">Keine Treffer</p>
    </div>
  );
}

export function ResultList({
  groups,
  tokens,
  expanded,
  onToggleExpand,
  cursor,
  mobile = false,
  activeLayerIds,
  onPick,
  onHover,
}: {
  groups: ResultGroup[];
  tokens: string[];
  expanded: Set<string>;
  onToggleExpand: (key: string) => void;
  cursor: number;
  mobile?: boolean;
  activeLayerIds: Set<string>;
  onPick: (hit: SearchHit) => void;
  onHover: (hit: SearchHit | null) => void;
}) {
  if (!groups.length) return <EmptyState />;
  let start = 0;
  return (
    <div>
      {groups.map((gr) => {
        const startIndex = start;
        start += Math.min(gr.hits.length, expanded.has(gr.key) ? EXPANDED_CAP : COLLAPSED);
        return (
          <Group
            key={gr.key}
            group={gr}
            expanded={expanded.has(gr.key)}
            onToggle={() => onToggleExpand(gr.key)}
            startIndex={startIndex}
            tokens={tokens}
            mobile={mobile}
            onPick={onPick}
            onHover={onHover}
            cursor={cursor}
            activeLayerIds={activeLayerIds}
          />
        );
      })}
    </div>
  );
}
