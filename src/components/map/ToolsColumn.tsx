import {
  Ruler,
  Pencil,
  Download,
  Printer,
  Share2,
  Map as MapIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { getArt } from "./InfoArtFlyout";
import type { QueryTab } from "@/types";

interface Tool {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Adding a new map tool is a one-line entry here — the column renders and
// wires it automatically. The "info" tool's icon/label reflect the active
// Abfrage-Art (Features/Statistik/Datasets) and are overridden at render.
const TOOLS: Tool[] = [
  { id: "info", label: "Info", icon: MapIcon },
  { id: "measure", label: "Messen", icon: Ruler },
  { id: "draw", label: "Zeichnen", icon: Pencil },
  { id: "export", label: "Daten beziehen", icon: Download },
  { id: "print", label: "Drucken", icon: Printer },
  { id: "share", label: "Teilen", icon: Share2 },
  { id: "basemap", label: "Kartendienst importieren", icon: MapIcon },
];

interface ToolsColumnProps {
  activeTool: string | null;
  onSelectTool: (id: string) => void;
  /** Current Abfrage-Art — drives the Info tool's icon and tooltip. */
  infoTab: QueryTab;
}

export function ToolsColumn({
  activeTool,
  onSelectTool,
  infoTab,
}: ToolsColumnProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col overflow-hidden rounded-md border border-black/10 bg-white shadow-md">
        {TOOLS.map((tool, i) => {
          // The Info tool mirrors the active query art.
          const art = tool.id === "info" ? getArt(infoTab) : null;
          const Icon = art ? art.icon : tool.icon;
          const label = art ? `${art.label} Abfrage` : tool.label;
          const isActive = activeTool === tool.id;
          return (
            <div key={tool.id}>
              {i > 0 && <div className="h-px bg-border" />}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onSelectTool(tool.id)}
                    className={cn(
                      "grid size-10 place-items-center transition-colors",
                      isActive
                        ? "bg-zh-blue text-white"
                        : "text-zinc-700 hover:bg-muted",
                    )}
                  >
                    <Icon className="size-[18px]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left">{label}</TooltipContent>
              </Tooltip>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
