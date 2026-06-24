import {
  Info,
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

interface Tool {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Adding a new map tool is a one-line entry here — the column renders and
// wires it automatically. The "info" tool drives the Info-Abfrage panel.
const TOOLS: Tool[] = [
  { id: "info", label: "Info", icon: Info },
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
}

export function ToolsColumn({ activeTool, onSelectTool }: ToolsColumnProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col overflow-hidden rounded-md border border-black/10 bg-white shadow-md">
        {TOOLS.map((tool, i) => {
          const Icon = tool.icon;
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
                <TooltipContent side="left">{tool.label}</TooltipContent>
              </Tooltip>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
