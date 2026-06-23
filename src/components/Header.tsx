import { ExternalLink, User } from "lucide-react";

import { cn } from "@/lib/utils";

const NAV: { label: string; active?: boolean; external?: boolean }[] = [
  { label: "Geoportal" },
  { label: "GIS-Browser", active: true },
  { label: "Geodatenkatalog" },
  { label: "Apps" },
  { label: "Hilfe & Support" },
  { label: "Geodatenshop", external: true },
];

export function Header() {
  return (
    <>
      <div className="h-[3px] shrink-0 bg-black" />
      <header className="flex h-14 shrink-0 items-center justify-between bg-zh-blue px-4 text-white">
        <a href="#" className="flex items-center">
          <img
            src="/geoportal-logo.svg"
            alt="Geoportal Kanton Zürich"
            className="h-8 w-auto"
          />
        </a>

        <nav className="flex items-center gap-0.5 text-sm">
          {NAV.map((item) => (
            <a
              key={item.label}
              href="#"
              className={cn(
                "flex items-center gap-1.5 rounded px-3 py-2 transition-colors hover:bg-white/10",
                item.active ? "font-bold" : "font-medium text-white/90",
              )}
            >
              {item.external && <ExternalLink className="size-4" />}
              {item.label}
            </a>
          ))}
          <span className="mx-1.5 h-6 w-px bg-white/30" />
          <a
            href="#"
            className="flex items-center gap-1.5 rounded px-3 py-2 font-medium text-white/90 transition-colors hover:bg-white/10"
          >
            <User className="size-4" />
            Login
          </a>
        </nav>
      </header>
    </>
  );
}
