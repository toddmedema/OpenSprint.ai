import { PhaseLoadingSpinner } from "./PhaseLoadingSpinner";
import { MacElectronTopDragRegion } from "./layout/MacElectronTopDragRegion";

/**
 * Generic Suspense fallback used for lazy-loaded routes (e.g. Settings/Help).
 * On macOS Electron, this must include a draggable top region so the window can be moved
 * while the fallback UI is visible.
 */
export function RouteFallback() {
  return (
    <div className="flex flex-col min-h-full">
      <MacElectronTopDragRegion />
      <div className="flex flex-1 min-h-0 items-center justify-center">
        <PhaseLoadingSpinner status="Loading…" aria-label="Loading" />
      </div>
    </div>
  );
}

