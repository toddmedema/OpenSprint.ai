import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "../contexts/ThemeContext";
import { DisplayPreferencesProvider } from "../contexts/DisplayPreferencesContext";
import { ProjectSettingsPage } from "./ProjectSettingsPage";

const mockGetSettings = vi.fn();
const mockGetKeys = vi.fn();
const mockModelsList = vi.fn();

vi.mock("../api/client", () => ({
  api: {
    projects: {
      get: vi.fn().mockResolvedValue({
        id: "proj-1",
        name: "Test Project",
        repoPath: "/path/to/repo",
        currentPhase: "sketch",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      }),
      getSettings: (...args: unknown[]) => mockGetSettings(...args),
      update: vi.fn().mockResolvedValue({}),
      updateSettings: vi.fn().mockResolvedValue({}),
      getAgentsInstructions: vi.fn().mockResolvedValue({ content: "" }),
      updateAgentsInstructions: vi.fn().mockResolvedValue({ saved: true }),
    },
    env: {
      getKeys: (...args: unknown[]) => mockGetKeys(...args),
    },
    models: {
      list: (...args: unknown[]) => mockModelsList(...args),
    },
    globalSettings: {
      get: vi.fn().mockResolvedValue({ databaseUrl: "" }),
    },
  },
}));

vi.mock("../components/FolderBrowser", () => ({
  FolderBrowser: () => null,
}));

vi.mock("../components/layout/Layout", () => ({
  Layout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

const mockSettings = {
  simpleComplexityAgent: { type: "cursor" as const, model: null, cliCommand: null },
  complexComplexityAgent: { type: "cursor" as const, model: null, cliCommand: null },
  deployment: { mode: "custom" as const },
  aiAutonomyLevel: "confirm_all" as const,
};

function renderProjectSettingsPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <DisplayPreferencesProvider>
          <MemoryRouter initialEntries={["/projects/proj-1/settings"]}>
            <Routes>
              <Route path="/projects/:projectId/settings" element={<ProjectSettingsPage />} />
            </Routes>
          </MemoryRouter>
        </DisplayPreferencesProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

describe("ProjectSettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSettings.mockResolvedValue(mockSettings);
    mockGetKeys.mockResolvedValue({
      anthropic: true,
      cursor: true,
      claudeCli: true,
      useCustomCli: false,
    });
    mockModelsList.mockResolvedValue([]);
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }))
    );
  });

  it("renders settings page with project settings modal", async () => {
    renderProjectSettingsPage();

    await waitFor(() => {
      expect(screen.getByTestId("project-settings-page")).toBeInTheDocument();
    });
    expect(screen.getByTestId("settings-modal")).toBeInTheDocument();
  });

  it("page has flex flex-col and overflow-hidden for proper scroll containment", async () => {
    renderProjectSettingsPage();

    await waitFor(() => {
      expect(screen.getByTestId("project-settings-page")).toBeInTheDocument();
    });

    const page = screen.getByTestId("project-settings-page");
    expect(page).toHaveClass("flex");
    expect(page).toHaveClass("flex-col");
    expect(page).toHaveClass("overflow-hidden");
    expect(page).toHaveClass("min-h-0");
  });

  it("settings modal wrapper is direct flex child of page (no extra wrapper) for correct scroll chain", async () => {
    renderProjectSettingsPage();

    await waitFor(() => {
      expect(screen.getByTestId("settings-modal")).toBeInTheDocument();
    });

    const page = screen.getByTestId("project-settings-page");
    const modal = screen.getByTestId("settings-modal");
    // Page has 2 direct children: header div and ProjectSettingsModal root
    const pageChildren = Array.from(page.children);
    expect(pageChildren.length).toBe(2);
    // Modal (settings content) is inside the second child - no extra overflow-hidden wrapper between
    const modalWrapper = pageChildren[1];
    expect(modalWrapper).toContainElement(modal);
    expect(modalWrapper).toHaveClass("flex-1");
    expect(modalWrapper).toHaveClass("min-h-0");
  });

  it("settings content area has overflow-y-auto for scroll when content exceeds viewport", async () => {
    renderProjectSettingsPage();

    await waitFor(() => {
      expect(screen.getByTestId("settings-modal-content")).toBeInTheDocument();
    });

    const agentConfigTab = screen.getByRole("button", { name: "Agent Config" });
    await userEvent.click(agentConfigTab);

    await waitFor(() => {
      expect(screen.getByText("Task Complexity")).toBeInTheDocument();
    });

    const contentArea = screen.getByTestId("settings-modal-content");
    expect(contentArea).toHaveClass("overflow-y-auto");
    expect(contentArea).toHaveClass("min-h-0");
  });
});
