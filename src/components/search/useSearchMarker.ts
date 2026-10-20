import { useCallback, useEffect, useRef } from "react";
import Overlay from "ol/Overlay";
import type Map from "ol/Map";

import { hitText } from "@/data/searchIndex";
import type { SearchHit } from "@/types";

/**
 * A map marker with label for search hits (separate from the Info pin).
 * Returns a setter: pass a hit to show it at its location, null to hide.
 */
export function useSearchMarker(map: Map | null) {
  const ref = useRef<{ overlay: Overlay; label: HTMLElement } | null>(null);

  useEffect(() => {
    if (!map) return;
    const el = document.createElement("div");
    el.className = "zh-search-marker";
    el.innerHTML =
      '<span class="zh-search-marker__halo"></span>' +
      '<span class="zh-search-marker__dot"></span>' +
      '<span class="zh-search-marker__label"></span>';
    const overlay = new Overlay({
      element: el,
      positioning: "center-center",
      stopEvent: false,
    });
    map.addOverlay(overlay);
    ref.current = {
      overlay,
      label: el.querySelector(".zh-search-marker__label") as HTMLElement,
    };
    return () => {
      map.removeOverlay(overlay);
      ref.current = null;
    };
  }, [map]);

  return useCallback((hit: SearchHit | null) => {
    const m = ref.current;
    if (!m) return;
    if (!hit?.coordinate) {
      m.overlay.setPosition(undefined);
      return;
    }
    m.label.textContent = hitText(hit);
    m.overlay.setPosition(hit.coordinate);
  }, []);
}
