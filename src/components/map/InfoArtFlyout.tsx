import { Layers, BarChart3, Database } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import type { QueryTab } from "@/types";

const ARTS: {
  id: QueryTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "features", label: "Features", icon: Layers },
  { id: "statistik", label: "Statistik", icon: BarChart3 },
  { id: "datasets", label: "Datasets", icon: Database },
];

interface InfoArtFlyoutProps {
  tab: QueryTab;
  onSelect: (tab: QueryTab) => void;
}

/**
 * Second column that appears left of the tool bar when the Info tool is
 * clicked. Picking an Abfrage-Art (Features/Statistik/Datasets) closes it.
 */
export function InfoArtFlyout({ tab, onSelect }: InfoArtFlyoutProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col overflow-hidden rounded-md border border-black/10 bg-white shadow-md">
        {ARTS.map((art, i) => {
          const Icon = art.icon;
          const isActive = tab === art.id;
          return (
            <div key={art.id}>
              {i > 0 && <div className="h-px bg-border" />}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onSelect(art.id)}
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
                <TooltipContent side="left">{art.label}</TooltipContent>
              </Tooltip>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
