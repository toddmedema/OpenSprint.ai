import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MacElectronTopDragRegion } from "./MacElectronTopDragRegion";
import { NAVBAR_HEIGHT } from "../../lib/constants";

describe("MacElectronTopDragRegion", () => {
  it("renders a 48px drag region on macOS Electron", () => {
    const prev = (window as unknown as { electron?: unknown }).electron;
    try {
      (window as unknown as { electron: { isElectron: true; platform?: string } }).electron = {
        isElectron: true,
        platform: "darwin",
      };

      render(<MacElectronTopDragRegion />);

      const el = screen.getByTestId("mac-electron-top-drag-region");
      expect(el).toBeInTheDocument();
      expect(el).toHaveStyle({ height: `${NAVBAR_HEIGHT}px` });

      const styleObj = el.style as unknown as Record<string, string>;
      expect(styleObj.webkitAppRegion || styleObj.WebkitAppRegion).toBe("drag");
      expect(el).toHaveAttribute("aria-hidden", "true");
    } finally {
      if (prev !== undefined) (window as unknown as { electron?: unknown }).electron = prev;
      else delete (window as unknown as { electron?: unknown }).electron;
    }
  });

  it("renders nothing on non-darwin platforms", () => {
    const prev = (window as unknown as { electron?: unknown }).electron;
    try {
      (window as unknown as { electron: { isElectron: true; platform?: string } }).electron = {
        isElectron: true,
        platform: "win32",
      };

      render(<MacElectronTopDragRegion />);
      expect(screen.queryByTestId("mac-electron-top-drag-region")).not.toBeInTheDocument();
    } finally {
      if (prev !== undefined) (window as unknown as { electron?: unknown }).electron = prev;
      else delete (window as unknown as { electron?: unknown }).electron;
    }
  });
});

