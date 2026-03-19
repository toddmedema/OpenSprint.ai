import { NAVBAR_HEIGHT } from "../../lib/constants";
import type { CSSProperties } from "react";

/**
 * Mac Electron: window dragging requires a DOM element with `-webkit-app-region: drag`.
 * This component provides the same top-region behavior as the main app `Navbar` height (48px).
 */
export function MacElectronTopDragRegion() {
  const isElectron = typeof window !== "undefined" && Boolean(window.electron?.isElectron);
  const isElectronMac = isElectron && window.electron?.platform === "darwin";

  if (!isElectronMac) return null;

  const dragStyle = {
    height: NAVBAR_HEIGHT,
    width: "100%",
    // React camelCase maps to `-webkit-app-region` in the DOM.
    WebkitAppRegion: "drag",
  } as unknown as CSSProperties;

  return <div data-testid="mac-electron-top-drag-region" style={dragStyle} aria-hidden="true" />;
}
