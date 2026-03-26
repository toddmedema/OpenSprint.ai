import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GlobalSettingsSubTabsBar } from "./GlobalSettingsSubTabsBar";
import { SettingsSubTabsBar } from "./SettingsSubTabsBar";
import { NAVBAR_HEIGHT } from "../../lib/constants";

describe("GlobalSettingsSubTabsBar", () => {
  it("uses the same bar shell as SettingsSubTabsBar (height, padding, centering)", () => {
    const { container: globalContainer, unmount: unmountGlobal } = render(
      <GlobalSettingsSubTabsBar activeTab="general" onTabChange={vi.fn()} />
    );
    const globalBar = globalContainer.firstElementChild as HTMLElement;
    expect(globalBar).toHaveAttribute("data-testid", "global-settings-sub-tabs-bar");
    expect(globalBar).toHaveClass("px-4", "sm:px-6", "flex", "items-center", "justify-center");
    expect(globalBar).toHaveStyle({ height: `${NAVBAR_HEIGHT}px` });
    expect(globalContainer.querySelector(".rounded-xl.border")).toBeTruthy();
    const globalShellClass = globalBar.className;
    unmountGlobal();

    const { container: projectContainer } = render(
      <SettingsSubTabsBar activeTab="basics" onTabChange={vi.fn()} />
    );
    const projectBar = projectContainer.firstElementChild as HTMLElement;
    expect(projectBar).toHaveAttribute("data-testid", "settings-sub-tabs-bar");
    expect(projectBar.className).toBe(globalShellClass);
    expect(projectBar).toHaveStyle({ height: `${NAVBAR_HEIGHT}px` });
    expect(projectContainer.querySelector(".rounded-xl.border")).toBeTruthy();
  });

  it("calls onTabChange when a tab is clicked", async () => {
    const onTabChange = vi.fn();
    const user = userEvent.setup();
    render(<GlobalSettingsSubTabsBar activeTab="general" onTabChange={onTabChange} />);

    await user.click(screen.getByTestId("global-settings-tab-agents"));
    expect(onTabChange).toHaveBeenCalledWith("agents");
  });
});
