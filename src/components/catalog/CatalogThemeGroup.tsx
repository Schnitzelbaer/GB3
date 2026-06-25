import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

/**
 * A collapsible theme section in the Kartenkatalog style (grey header bar with
 * chevron). Used by the Datasets tab to group found datasets by theme.
 */
export function CatalogThemeGroup({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 bg-secondary/70 px-3 py-2 text-left transition-colors hover:bg-secondary"
      >
        <span className="text-[13px] font-semibold">{title}</span>
        {open ? (
          <ChevronDown className="size-4 shrink-0 text-zinc-500" />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-zinc-500" />
        )}
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}
