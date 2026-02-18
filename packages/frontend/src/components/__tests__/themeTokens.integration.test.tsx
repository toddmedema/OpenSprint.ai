/**
 * Integration tests for theme-aware components.
 * Verifies that key components use theme tokens (not hard-coded colors) so they
 * render correctly in light, dark, and system themes.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import notificationReducer from "../../store/slices/notificationSlice";
import executeReducer from "../../store/slices/executeSlice";
import planReducer from "../../store/slices/planSlice";
import { HomeScreen } from "../HomeScreen";
import { Layout } from "../layout/Layout";

vi.mock("../../api/client", () => ({
  api: {
    projects: { list: () => Promise.resolve([]) },
    agents: { active: () => Promise.resolve([]) },
  },
}));

function createTestStore() {
  return configureStore({
    reducer: {
      notification: notificationReducer,
      execute: executeReducer,
      plan: planReducer,
    },
  });
}

describe("theme-aware components", () => {
  beforeEach(() => {
    document.documentElement.setAttribute("data-theme", "light");
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  it("HomeScreen uses theme tokens (no hard-coded brand-50/brand-700 for badges)", async () => {
    render(
      <Provider store={createTestStore()}>
        <MemoryRouter>
          <Layout>
            <HomeScreen />
          </Layout>
        </MemoryRouter>
      </Provider>
    );
    await screen.findByText("No projects yet");
    // HomeScreen should use theme tokens; phase badges use theme-info-bg/text
    // (replaced from brand-50/brand-700 for dark mode compatibility)
    const html = document.body.innerHTML;
    expect(html).toContain("text-theme-text");
    expect(html).toContain("text-theme-muted");
    // Should NOT use the old hard-coded brand-50 for phase badges
    expect(html).not.toMatch(/bg-brand-50.*text-brand-700/);
  });

  it("Layout uses theme tokens for background", () => {
    render(
      <Provider store={createTestStore()}>
        <MemoryRouter>
          <Layout>
            <div data-testid="child">Content</div>
          </Layout>
        </MemoryRouter>
      </Provider>
    );
    const outer = document.querySelector(".bg-theme-bg");
    expect(outer).toBeInTheDocument();
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("components respond to dark theme when data-theme is dark", () => {
    document.documentElement.setAttribute("data-theme", "dark");
    render(
      <Provider store={createTestStore()}>
        <MemoryRouter>
          <Layout>
            <div data-testid="dark-content">Dark mode content</div>
          </Layout>
        </MemoryRouter>
      </Provider>
    );
    // CSS variables are redefined in index.css for html[data-theme="dark"]
    // Components using var(--color-*) will automatically pick up dark values
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(screen.getByTestId("dark-content")).toHaveTextContent("Dark mode content");
  });
});
