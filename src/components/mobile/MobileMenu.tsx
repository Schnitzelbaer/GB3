import { ExternalLink, User, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { NAV } from "../Header";

/** Full-screen navigation for small screens (replaces the blue header). */
export function MobileMenu({ onClose }: { onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menü"
      className="fixed inset-0 z-[70] flex flex-col bg-zh-blue text-white"
    >
      <div className="flex h-16 shrink-0 items-center justify-between px-6">
        <a href="#" className="flex items-center gap-2 text-lg tracking-wide">
          <User className="size-5" />
          Login
        </a>
        <button
          type="button"
          aria-label="Menü schliessen"
          onClick={onClose}
          className="-mr-2 grid size-11 place-items-center rounded-md hover:bg-white/10"
        >
          <X className="size-6" />
        </button>
      </div>
      <div className="mx-3 h-px bg-white/30" />
      <nav className="flex flex-col py-2">
        {NAV.map((item) => (
          <a
            key={item.label}
            href="#"
            aria-current={item.active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 px-6 py-4 text-lg tracking-[0.06em] transition-colors hover:bg-white/5",
              item.active && "font-bold",
            )}
          >
            {item.external && <ExternalLink className="size-5" />}
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
