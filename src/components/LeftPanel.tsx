import { useMemo, useState } from "react";
import {
  HelpCircle,
  Bell,
  Trash2,
  Star,
  PanelLeftClose,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  Plus,
  Check,
  GripVertical,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Slider } from "./ui/slider";
import type { ActiveLayer, CatalogTheme } from "@/types";

function thumbHue(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
}

function MapThumb({
  id,
  badge,
}: {
  id: string;
  badge?: "add" | "check" | "none";
}) {
  const h = thumbHue(id);
  return (
    <span
      className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-sm ring-1 ring-black/10"
      style={{
        backgroundImage: `linear-gradient(135deg, hsl(${h} 50% 82%), hsl(${(h + 45) % 360} 55% 60%))`,
      }}
    >
      <span
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg,transparent 0 6px,rgba(255,255,255,.6) 6px 7px),repeating-linear-gradient(0deg,transparent 0 6px,rgba(255,255,255,.6) 6px 7px)",
        }}
      />
      {badge === "add" && (
        <span className="absolute bottom-0 right-0 grid size-4 place-items-center rounded-tl bg-zh-blue text-white">
          <Plus className="size-3" />
        </span>
      )}
      {badge === "check" && (
        <span className="absolute bottom-0 left-0 grid size-4 place-items-center rounded-tr bg-zh-blue text-white">
          <Check className="size-3" />
        </span>
      )}
    </span>
  );
}

function IconBtn({
  title,
  onClick,
  dot,
  children,
}: {
  title: string;
  onClick?: () => void;
  dot?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="relative grid size-7 place-items-center rounded text-white/90 transition-colors hover:bg-white/15"
    >
      {children}
      {dot && (
        <span className="absolute right-1 top-1 size-1.5 rounded-full bg-red-500 ring-1 ring-zh-blue" />
      )}
    </button>
  );
}

interface LeftPanelProps {
  catalog: CatalogTheme[];
  activeLayers: ActiveLayer[];
  onAddMap: (id: string, title: string) => void;
  onRemoveLayer: (id: string) => void;
  onClearActive: () => void;
  onToggleVisible: (id: string) => void;
  onSetOpacity: (id: string, opacity: number) => void;
  onClose: () => void;
}

export function LeftPanel({
  catalog,
  activeLayers,
  onAddMap,
  onRemoveLayer,
  onClearActive,
  onToggleVisible,
  onSetOpacity,
  onClose,
}: LeftPanelProps) {
  const [filter, setFilter] = useState("");
  const [catalogOpen, setCatalogOpen] = useState(true);
  const [expandedThemes, setExpandedThemes] = useState<Set<string>>(
    new Set(["flora-fauna"]),
  );
  const [expandedActive, setExpandedActive] = useState<Set<string>>(new Set());

  const q = filter.trim().toLowerCase();
  const themes = useMemo(() => {
    if (!q) return catalog;
    return catalog
      .map((t) => ({
        ...t,
        maps: t.maps.filter(
          (m) =>
            m.title.toLowerCase().includes(q) ||
            t.title.toLowerCase().includes(q),
        ),
      }))
      .filter((t) => t.maps.length > 0);
  }, [catalog, q]);

  function toggle(set: Set<string>, id: string) {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  }

  const activeIds = new Set(activeLayers.map((l) => l.id));

  return (
    <div className="flex h-full flex-col overflow-hidden border-r border-border bg-white">
      {/* ---------- Aktive Karten ---------- */}
      <div className="flex h-10 shrink-0 items-center gap-1 bg-zh-blue px-3 text-white">
        <span className="text-[15px] font-semibold">Aktive Karten</span>
        <Badge className="ml-1 size-5">{activeLayers.length}</Badge>
        <div className="flex-1" />
        <IconBtn title="Hilfe">
          <HelpCircle className="size-[18px]" />
        </IconBtn>
        <IconBtn title="Benachrichtigungen" dot>
          <Bell className="size-[18px]" />
        </IconBtn>
        <IconBtn title="Alle Karten entfernen" onClick={onClearActive}>
          <Trash2 className="size-[18px]" />
        </IconBtn>
        <IconBtn title="Favoriten">
          <Star className="size-[18px]" />
        </IconBtn>
        <span className="mx-0.5 h-5 w-px bg-white/30" />
        <IconBtn title="Bereich schliessen" onClick={onClose}>
          <PanelLeftClose className="size-[18px]" />
        </IconBtn>
      </div>

      <div className="max-h-[40%] shrink-0 overflow-y-auto scrollbar-thin">
        {activeLayers.length === 0 ? (
          <p className="px-3 py-4 text-[13px] text-muted-foreground">
            Keine aktiven Karten. Fügen Sie unten aus dem Kartenkatalog Karten
            hinzu.
          </p>
        ) : (
          activeLayers.map((layer) => {
            const expanded = expandedActive.has(layer.id);
            const Chevron = expanded ? ChevronDown : ChevronRight;
            return (
              <div key={layer.id} className="border-b border-border last:border-0">
                <div className="flex items-center gap-2 px-2 py-2">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedActive((s) => toggle(s, layer.id))
                    }
                    className="text-zinc-500 hover:text-foreground"
                  >
                    <Chevron className="size-4" />
                  </button>
                  <button
                    type="button"
                    title="Sichtbarkeit umschalten"
                    onClick={() => onToggleVisible(layer.id)}
                  >
                    <MapThumb
                      id={layer.id}
                      badge={layer.visible ? "check" : "none"}
                    />
                  </button>
                  <span
                    className={cn(
                      "line-clamp-2 min-w-0 flex-1 text-[13px] leading-tight",
                      !layer.visible && "text-muted-foreground line-through",
                    )}
                  >
                    {layer.title}
                  </span>
                  <GripVertical className="size-4 shrink-0 cursor-grab text-zinc-300" />
                </div>
                {expanded && (
                  <div className="space-y-2 pb-3 pl-11 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="w-20 text-xs text-muted-foreground">
                        Transparenz
                      </span>
                      <Slider
                        className="flex-1"
                        value={[layer.opacity * 100]}
                        max={100}
                        step={1}
                        onValueChange={([v]) =>
                          onSetOpacity(layer.id, v / 100)
                        }
                      />
                      <span className="w-9 text-right text-xs tabular-nums">
                        {Math.round(layer.opacity * 100)}%
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveLayer(layer.id)}
                      className="text-xs font-medium text-destructive hover:underline"
                    >
                      Aus Karte entfernen
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ---------- Kartenkatalog ---------- */}
      <button
        type="button"
        onClick={() => setCatalogOpen((o) => !o)}
        className="flex h-10 shrink-0 items-center justify-between bg-zh-blue px-3 text-white"
      >
        <span className="text-[15px] font-semibold">Kartenkatalog</span>
        {catalogOpen ? (
          <ChevronDown className="size-[18px]" />
        ) : (
          <ChevronRight className="size-[18px]" />
        )}
      </button>

      {catalogOpen && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 p-2">
            <div className="flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Karten und Layer filtern"
                className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {filter && (
                <button
                  type="button"
                  onClick={() => setFilter("")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
            {themes.map((theme) => {
              const open = q ? true : expandedThemes.has(theme.id);
              return (
                <div key={theme.id} className="border-b border-border">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedThemes((s) => toggle(s, theme.id))
                    }
                    className="flex w-full items-center justify-between gap-2 bg-secondary/70 px-3 py-2 text-left transition-colors hover:bg-secondary"
                  >
                    <span className="text-[13px] font-semibold">
                      {theme.title}
                    </span>
                    {open ? (
                      <ChevronDown className="size-4 shrink-0 text-zinc-500" />
                    ) : (
                      <ChevronRight className="size-4 shrink-0 text-zinc-500" />
                    )}
                  </button>
                  {open && (
                    <div>
                      {theme.maps.map((m) => {
                        const isActive = activeIds.has(m.id);
                        return (
                          <div
                            key={m.id}
                            className="flex items-center gap-2 px-3 py-2 hover:bg-muted/60"
                          >
                            <button
                              type="button"
                              title={
                                isActive
                                  ? "Bereits aktiv"
                                  : "Zur Karte hinzufügen"
                              }
                              disabled={isActive}
                              onClick={() => onAddMap(m.id, m.title)}
                              className={cn(isActive && "opacity-60")}
                            >
                              <MapThumb
                                id={m.id}
                                badge={isActive ? "check" : "add"}
                              />
                            </button>
                            <span className="line-clamp-2 min-w-0 flex-1 text-[13px] leading-tight">
                              {m.title}
                            </span>
                            <ChevronRight className="size-4 shrink-0 text-zinc-300" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
