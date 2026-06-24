import { useState } from "react";
import { ChevronDown, ChevronRight, Info as InfoIcon } from "lucide-react";

/** Filled dark circle with a white "i" — the dataset/layer info affordance. */
export function BlackInfo() {
  return (
    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-foreground text-background">
      <InfoIcon className="size-3" />
    </span>
  );
}

/**
 * Collapsible "dataset" section with the tinted header, gradient thumbnail,
 * bold title and info circle — shared by the Features and Statistik tabs so
 * both look identical.
 */
export function DatasetDisclosure({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const Chevron = open ? ChevronDown : ChevronRight;
  return (
    <div className="py-1">
      <div className="flex items-center gap-2 rounded bg-muted px-2 py-1.5">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="text-zinc-500 hover:text-foreground"
        >
          <Chevron className="size-4" />
        </button>
        <span
          className="size-6 shrink-0 rounded-sm ring-1 ring-black/10"
          style={{
            backgroundImage:
              "linear-gradient(135deg,#c940b2 0%,#f39237 50%,#78be5a 100%)",
          }}
        />
        <span
          className="min-w-0 flex-1 truncate text-[15px] font-bold"
          title={title}
        >
          {title}
        </span>
        <button type="button" title="Informationen zum Datensatz">
          <BlackInfo />
        </button>
      </div>
      {open && <div className="space-y-1 pb-1 pl-5 pt-1">{children}</div>}
    </div>
  );
}
