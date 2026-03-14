import type { BrowserWindowConstructorOptions } from "electron";

export const DEFAULT_WINDOW_WIDTH = 1280;
export const DEFAULT_WINDOW_HEIGHT = 800;
export const DESKTOP_TOP_BAR_HEIGHT = 48;
export const MAC_TRAFFIC_LIGHT_X = 14;
export const MAC_TRAFFIC_LIGHT_Y = 16;

interface BuildWindowOptionsArgs {
  appName: string;
  iconPath: string | null;
  preloadPath: string;
  platform: NodeJS.Platform;
}

export function buildWindowOptions({
  appName,
  iconPath,
  preloadPath,
  platform,
}: BuildWindowOptionsArgs): BrowserWindowConstructorOptions {
  const windowOptions: BrowserWindowConstructorOptions = {
    width: DEFAULT_WINDOW_WIDTH,
    height: DEFAULT_WINDOW_HEIGHT,
    title: appName,
    icon: iconPath || undefined,
    show: false,
    backgroundColor: "#0f172a",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: preloadPath,
    },
  };

  if (platform === "darwin") {
    // Keep native traffic lights and reserve the app top bar height as draggable title bar overlay.
    windowOptions.titleBarStyle = "hidden";
    windowOptions.titleBarOverlay = { height: DESKTOP_TOP_BAR_HEIGHT };
    windowOptions.trafficLightPosition = { x: MAC_TRAFFIC_LIGHT_X, y: MAC_TRAFFIC_LIGHT_Y };
  } else if (platform === "win32") {
    // Hide default title bar; window controls are rendered by the app.
    windowOptions.titleBarStyle = "hidden";
  }

  return windowOptions;
}
