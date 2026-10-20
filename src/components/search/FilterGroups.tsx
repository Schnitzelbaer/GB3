import { cn } from "@/lib/utils";
import type { FilterSection } from "@/data/searchIndex";

/**
 * The three filter groups with real checkboxes, labels and counts. Used by
 * the desktop filter column and the mobile filter sheet.
 */
export function FilterGroups({
  sections,
  active,
  onToggle,
  touch = false,
}: {
  sections: FilterSection[];
  active: Set<string>;
  onToggle: (id: string) => void;
  /** Larger rows (min. 44 px) for the mobile sheet. */
  touch?: boolean;
}) {
  return (
    <div className="space-y-1">
      {sections.map((section) => (
        <fieldset key={section.id} className="min-w-0">
          <legend className="px-2 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-foreground/75">
            {section.title}
          </legend>
          {section.filters.map((f) => {
            const on = active.has(f.id);
            return (
              <label
                key={f.id}
                title={f.label}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-md px-2 transition-colors",
                  touch ? "min-h-11 py-2" : "py-1.5",
                  on ? "bg-zh-blue/10" : "hover:bg-muted",
                )}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => onToggle(f.id)}
                  className="size-4 shrink-0 cursor-pointer accent-zh-blue"
                />
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-sm",
                    on && "font-semibold",
                  )}
                >
                  {f.label}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {f.count}
                </span>
              </label>
            );
          })}
        </fieldset>
      ))}
    </div>
  );
}
