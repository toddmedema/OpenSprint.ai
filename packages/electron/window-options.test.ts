import { describe, it, expect } from "vitest";
import {
  buildWindowOptions,
  DESKTOP_TOP_BAR_HEIGHT,
  MAC_TRAFFIC_LIGHT_X,
  MAC_TRAFFIC_LIGHT_Y,
} from "./window-options";

describe("buildWindowOptions", () => {
  it("sets full-width macOS title bar overlay height to navbar height", () => {
    const options = buildWindowOptions({
      appName: "Open Sprint",
      iconPath: null,
      preloadPath: "/tmp/preload.js",
      platform: "darwin",
    });

    expect(options.titleBarStyle).toBe("hidden");
    expect(options.titleBarOverlay).toEqual({ height: DESKTOP_TOP_BAR_HEIGHT });
    expect(options.trafficLightPosition).toEqual({
      x: MAC_TRAFFIC_LIGHT_X,
      y: MAC_TRAFFIC_LIGHT_Y,
    });
  });

  it("does not add title bar overlay outside macOS", () => {
    const options = buildWindowOptions({
      appName: "Open Sprint",
      iconPath: null,
      preloadPath: "/tmp/preload.js",
      platform: "win32",
    });

    expect(options.titleBarStyle).toBe("hidden");
    expect(options.titleBarOverlay).toBeUndefined();
  });
});
