import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RouteFallback } from "./RouteFallback";

describe("RouteFallback", () => {
  it("shows the Mac Electron draggable top region on darwin", () => {
    const prev = (window as unknown as { electron?: unknown }).electron;
    try {
      (window as unknown as { electron: { isElectron: true; platform?: string } }).electron = {
        isElectron: true,
        platform: "darwin",
      };

      render(<RouteFallback />);
      expect(screen.getByTestId("mac-electron-top-drag-region")).toBeInTheDocument();
    } finally {
      if (prev !== undefined) (window as unknown as { electron?: unknown }).electron = prev;
      else delete (window as unknown as { electron?: unknown }).electron;
    }
  });

  it("omits the draggable top region on non-darwin", () => {
    const prev = (window as unknown as { electron?: unknown }).electron;
    try {
      (window as unknown as { electron: { isElectron: true; platform?: string } }).electron = {
        isElectron: true,
        platform: "win32",
      };

      render(<RouteFallback />);
      expect(screen.queryByTestId("mac-electron-top-drag-region")).not.toBeInTheDocument();
    } finally {
      if (prev !== undefined) (window as unknown as { electron?: unknown }).electron = prev;
      else delete (window as unknown as { electron?: unknown }).electron;
    }
  });
});

