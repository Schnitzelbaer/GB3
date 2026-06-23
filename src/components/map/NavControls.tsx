import { Plus, Minus, Home, LocateFixed } from "lucide-react";

import { cn } from "@/lib/utils";
import { useMapInstance, CANTON_EXTENT } from "@/lib/mapContext";

function ZoomButton({
  onClick,
  title,
  children,
  className,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "grid size-9 place-items-center text-zinc-700 transition-colors hover:bg-muted",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function NavControls() {
  const map = useMapInstance();

  function zoomBy(delta: number) {
    if (!map) return;
    const view = map.getView();
    const zoom = view.getZoom();
    if (zoom == null) return;
    view.animate({ zoom: zoom + delta, duration: 200 });
  }

  function home() {
    if (!map) return;
    map.getView().fit(CANTON_EXTENT, { duration: 500, padding: [20, 20, 20, 20] });
  }

  function locate() {
    if (!map) return;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coord = [pos.coords.longitude, pos.coords.latitude];
        import("ol/proj").then(({ fromLonLat }) => {
          map
            .getView()
            .animate({
              center: fromLonLat(coord, "EPSG:2056"),
              resolution: 2,
              duration: 600,
            });
        });
      },
      () => {
        // Fallback: centre on the city of Zürich.
        map.getView().animate({ center: [2683100, 1247600], resolution: 5 });
      },
    );
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-md border border-black/10 bg-white shadow-md">
      <ZoomButton title="Standort" onClick={locate}>
        <LocateFixed className="size-[18px]" />
      </ZoomButton>
      <div className="h-px bg-border" />
      <ZoomButton title="Ganze Ansicht (Kanton Zürich)" onClick={home}>
        <Home className="size-[18px]" />
      </ZoomButton>
      <div className="h-px bg-border" />
      <ZoomButton title="Hineinzoomen" onClick={() => zoomBy(1)}>
        <Plus className="size-5" />
      </ZoomButton>
      <div className="h-px bg-border" />
      <ZoomButton title="Herauszoomen" onClick={() => zoomBy(-1)}>
        <Minus className="size-5" />
      </ZoomButton>
    </div>
  );
}
