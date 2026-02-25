import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { HomeScreen } from "./HomeScreen";
import { CONTENT_CONTAINER_CLASS } from "../lib/constants";
import notificationReducer from "../store/slices/notificationSlice";

const mockProjectsList = vi.fn();
const mockArchive = vi.fn();
const mockDelete = vi.fn();

vi.mock("../api/client", () => ({
  api: {
    projects: {
      list: (...args: unknown[]) => mockProjectsList(...args),
      archive: (...args: unknown[]) => mockArchive(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
    },
  },
}));

vi.mock("./layout/Layout", () => ({
  Layout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

function renderHomeScreen() {
  const store = configureStore({
    reducer: { notification: notificationReducer },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <HomeScreen />
      </MemoryRouter>
    </Provider>
  );
}

const mockProject = {
  id: "proj-1",
  name: "My Project",
  repoPath: "/path/to/repo",
  currentPhase: "sketch" as const,
  createdAt: "2026-02-15T12:00:00Z",
  updatedAt: "2026-02-15T12:00:00Z",
};

describe("HomeScreen", () => {
  beforeEach(() => {
    mockProjectsList.mockReset();
    mockArchive.mockReset();
    mockDelete.mockReset();
  });

  it("shows loading state while fetching projects", async () => {
    mockProjectsList.mockImplementation(() => new Promise(() => {}));

    renderHomeScreen();

    expect(screen.getByText("Loading projects...")).toBeInTheDocument();
  });

  it("shows table with create row when no projects", async () => {
    mockProjectsList.mockResolvedValue([]);

    renderHomeScreen();

    await screen.findByTestId("projects-table");
    expect(screen.getByTestId("create-project-row")).toHaveTextContent("+ Create project");
  });

  it("renders project rows when projects exist", async () => {
    mockProjectsList.mockResolvedValue([mockProject]);

    renderHomeScreen();

    await screen.findByText("My Project");
    expect(screen.getByTestId("project-row-proj-1")).toBeInTheDocument();
    expect(screen.getByText("/path/to/repo")).toBeInTheDocument();
  });

  it("Create project row navigates to /projects/new", async () => {
    mockProjectsList.mockResolvedValue([]);
    const user = userEvent.setup();

    function LocationDisplay() {
      return <div data-testid="location">{useLocation().pathname}</div>;
    }

    const store = configureStore({ reducer: { notification: notificationReducer } });
    render(
      <Provider store={store}>
        <MemoryRouter>
          <HomeScreen />
          <LocationDisplay />
        </MemoryRouter>
      </Provider>
    );

    await screen.findByTestId("create-project-row");
    const createRow = screen.getByRole("button", { name: /\+ Create project/i });
    await user.click(createRow);

    expect(screen.getByTestId("location")).toHaveTextContent("/projects/new");
  });

  it("clicking project row navigates to project sketch", async () => {
    mockProjectsList.mockResolvedValue([mockProject]);
    const user = userEvent.setup();

    function LocationDisplay() {
      return <div data-testid="location">{useLocation().pathname}</div>;
    }

    const store = configureStore({ reducer: { notification: notificationReducer } });
    render(
      <Provider store={store}>
        <MemoryRouter>
          <HomeScreen />
          <LocationDisplay />
        </MemoryRouter>
      </Provider>
    );

    await screen.findByText("My Project");
    const row = screen.getByTestId("project-row-proj-1");
    await user.click(row);

    expect(screen.getByTestId("location")).toHaveTextContent("/projects/proj-1/sketch");
  });

  it("table has Name and Folder path columns", async () => {
    mockProjectsList.mockResolvedValue([mockProject]);

    renderHomeScreen();

    await screen.findByText("My Project");
    expect(screen.getByRole("columnheader", { name: /name/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /folder path/i })).toBeInTheDocument();
  });

  it("shows three-dot menu button on each project row", async () => {
    mockProjectsList.mockResolvedValue([mockProject]);

    renderHomeScreen();

    await screen.findByText("My Project");
    expect(screen.getByTestId("project-row-menu-proj-1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /project actions/i })).toBeInTheDocument();
  });

  it("opens dropdown with Archive and Delete when clicking three-dot menu", async () => {
    mockProjectsList.mockResolvedValue([mockProject]);
    const user = userEvent.setup();

    renderHomeScreen();

    await screen.findByText("My Project");
    expect(screen.queryByTestId("project-row-dropdown-proj-1")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("project-row-menu-proj-1"));

    expect(screen.getByTestId("project-row-dropdown-proj-1")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /archive/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /delete/i })).toBeInTheDocument();
  });

  it("shows Archive modal when clicking Archive in dropdown", async () => {
    mockProjectsList.mockResolvedValue([mockProject]);
    const user = userEvent.setup();

    renderHomeScreen();

    await screen.findByText("My Project");
    await user.click(screen.getByTestId("project-row-menu-proj-1"));
    await user.click(screen.getByRole("menuitem", { name: /archive/i }));

    expect(screen.getByRole("heading", { name: /archive project/i })).toBeInTheDocument();
    expect(
      screen.getByText(/This will remove the project from the UI, but not delete its data/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /proceed/i })).toBeInTheDocument();
  });

  it("shows Delete modal when clicking Delete in dropdown", async () => {
    mockProjectsList.mockResolvedValue([mockProject]);
    const user = userEvent.setup();

    renderHomeScreen();

    await screen.findByText("My Project");
    await user.click(screen.getByTestId("project-row-menu-proj-1"));
    await user.click(screen.getByRole("menuitem", { name: /delete/i }));

    expect(screen.getByRole("heading", { name: /delete project/i })).toBeInTheDocument();
    expect(
      screen.getByText(
        /delete all OpenSprint-related data from the project folder\. Task data in the global store is not removed/i
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /proceed/i })).toBeInTheDocument();
  });

  it("Cancel closes modal with no side effects", async () => {
    mockProjectsList.mockResolvedValue([mockProject]);
    const user = userEvent.setup();

    renderHomeScreen();

    await screen.findByText("My Project");
    await user.click(screen.getByTestId("project-row-menu-proj-1"));
    await user.click(screen.getByRole("menuitem", { name: /archive/i }));

    expect(screen.getByRole("heading", { name: /archive project/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.queryByRole("heading", { name: /archive project/i })).not.toBeInTheDocument();
    expect(mockArchive).not.toHaveBeenCalled();
  });

  it("Proceed on Archive calls archive API and refreshes list", async () => {
    mockProjectsList.mockResolvedValue([mockProject]);
    mockArchive.mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderHomeScreen();

    await screen.findByText("My Project");
    await user.click(screen.getByTestId("project-row-menu-proj-1"));
    await user.click(screen.getByRole("menuitem", { name: /archive/i }));
    await user.click(screen.getByRole("button", { name: /proceed/i }));

    await screen.findByTestId("projects-table");
    expect(mockArchive).toHaveBeenCalledWith("proj-1");
    expect(mockProjectsList).toHaveBeenCalledTimes(2); // initial load + refresh
  });

  it("Proceed on Delete calls delete API and refreshes list", async () => {
    mockProjectsList.mockResolvedValue([mockProject]);
    mockDelete.mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderHomeScreen();

    await screen.findByText("My Project");
    await user.click(screen.getByTestId("project-row-menu-proj-1"));
    await user.click(screen.getByRole("menuitem", { name: /delete/i }));
    await user.click(screen.getByRole("button", { name: /proceed/i }));

    await screen.findByTestId("projects-table");
    expect(mockDelete).toHaveBeenCalledWith("proj-1");
    expect(mockProjectsList).toHaveBeenCalledTimes(2); // initial load + refresh
  });

  it("removed project no longer appears after Archive", async () => {
    mockProjectsList.mockResolvedValueOnce([mockProject]).mockResolvedValueOnce([]);
    mockArchive.mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderHomeScreen();

    await screen.findByText("My Project");
    await user.click(screen.getByTestId("project-row-menu-proj-1"));
    await user.click(screen.getByRole("menuitem", { name: /archive/i }));
    await user.click(screen.getByRole("button", { name: /proceed/i }));

    await screen.findByTestId("projects-table");
    expect(screen.queryByText("My Project")).not.toBeInTheDocument();
    expect(screen.queryByTestId("project-row-proj-1")).not.toBeInTheDocument();
  });

  it("removed project no longer appears after Delete", async () => {
    mockProjectsList.mockResolvedValueOnce([mockProject]).mockResolvedValueOnce([]);
    mockDelete.mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderHomeScreen();

    await screen.findByText("My Project");
    await user.click(screen.getByTestId("project-row-menu-proj-1"));
    await user.click(screen.getByRole("menuitem", { name: /delete/i }));
    await user.click(screen.getByRole("button", { name: /proceed/i }));

    await screen.findByTestId("projects-table");
    expect(screen.queryByText("My Project")).not.toBeInTheDocument();
    expect(screen.queryByTestId("project-row-proj-1")).not.toBeInTheDocument();
  });

  it("dispatches error notification when archive fails", async () => {
    mockProjectsList.mockResolvedValue([mockProject]);
    mockArchive.mockRejectedValue(new Error("Folder not found"));
    const user = userEvent.setup();

    const store = configureStore({ reducer: { notification: notificationReducer } });
    render(
      <Provider store={store}>
        <MemoryRouter>
          <HomeScreen />
        </MemoryRouter>
      </Provider>
    );

    await screen.findByText("My Project");
    await user.click(screen.getByTestId("project-row-menu-proj-1"));
    await user.click(screen.getByRole("menuitem", { name: /archive/i }));
    await user.click(screen.getByRole("button", { name: /proceed/i }));

    expect(store.getState().notification.items).toHaveLength(1);
    expect(store.getState().notification.items[0].message).toBe("Folder not found");
    expect(store.getState().notification.items[0].severity).toBe("error");
  });

  it("dispatches error notification when delete fails", async () => {
    mockProjectsList.mockResolvedValue([mockProject]);
    mockDelete.mockRejectedValue(new Error("Permission denied"));
    const user = userEvent.setup();

    const store = configureStore({ reducer: { notification: notificationReducer } });
    render(
      <Provider store={store}>
        <MemoryRouter>
          <HomeScreen />
        </MemoryRouter>
      </Provider>
    );

    await screen.findByText("My Project");
    await user.click(screen.getByTestId("project-row-menu-proj-1"));
    await user.click(screen.getByRole("menuitem", { name: /delete/i }));
    await user.click(screen.getByRole("button", { name: /proceed/i }));

    expect(store.getState().notification.items).toHaveLength(1);
    expect(store.getState().notification.items[0].message).toBe("Permission denied");
    expect(store.getState().notification.items[0].severity).toBe("error");
  });

  it("project list container uses same width as evaluate feedback input (CONTENT_CONTAINER_CLASS)", async () => {
    mockProjectsList.mockResolvedValue([]);

    renderHomeScreen();

    await screen.findByTestId("projects-table");
    const container = screen.getByTestId("project-list-container");
    for (const cls of CONTENT_CONTAINER_CLASS.split(" ")) {
      expect(container).toHaveClass(cls);
    }
  });

  it("projects table uses table-fixed so width matches evaluate feedback input regardless of content", async () => {
    mockProjectsList.mockResolvedValue([]);

    renderHomeScreen();

    const table = await screen.findByTestId("projects-table");
    expect(table).toHaveClass("table-fixed");
    expect(table).toHaveClass("w-full");
  });

  it("project name and path columns truncate long content within fixed table width", async () => {
    mockProjectsList.mockResolvedValue([mockProject]);

    renderHomeScreen();

    await screen.findByText("My Project");
    const nameHeader = screen.getByRole("columnheader", { name: /name/i });
    const nameCell = screen.getByTestId("project-row-proj-1").querySelector("td:first-child");
    const pathCell = screen.getByTestId("project-row-proj-1").querySelector("td:nth-child(2)");
    // Cells have truncate and min-w-0 so long content is truncated within fixed table width
    expect(nameHeader).toHaveClass("whitespace-nowrap");
    expect(nameCell).toHaveClass("truncate");
    expect(nameCell).toHaveClass("min-w-0");
    expect(pathCell).toHaveClass("truncate");
    expect(pathCell).toHaveClass("min-w-0");
  });

  it("project name and path cells have title attribute for full text tooltip on hover", async () => {
    const longPath = "/Users/todd/opensprint.dev";
    mockProjectsList.mockResolvedValue([
      { ...mockProject, name: "My Project", repoPath: longPath },
    ]);

    renderHomeScreen();

    await screen.findByText("My Project");
    const nameCell = screen.getByTestId("project-row-proj-1").querySelector("td:first-child");
    const pathCell = screen.getByTestId("project-row-proj-1").querySelector("td:nth-child(2)");
    expect(nameCell).toHaveAttribute("title", "My Project");
    expect(pathCell).toHaveAttribute("title", longPath);
  });

  it("table wrapper uses w-full so width matches evaluate feedback container", async () => {
    mockProjectsList.mockResolvedValue([]);

    renderHomeScreen();

    const table = await screen.findByTestId("projects-table");
    const wrapper = table.closest(".card");
    expect(wrapper).toHaveClass("w-full");
  });

  it("layout remains consistent with long project names and paths", async () => {
    const longName = "A".repeat(200);
    const longPath = "/very/long/path/" + "segment/".repeat(50);
    mockProjectsList.mockResolvedValue([
      { ...mockProject, id: "proj-long", name: longName, repoPath: longPath },
    ]);

    renderHomeScreen();

    await screen.findByTestId("projects-table");
    const container = screen.getByTestId("project-list-container");
    const table = screen.getByTestId("projects-table");

    // Container and table share same width constraint; table-fixed ensures consistent width
    for (const cls of CONTENT_CONTAINER_CLASS.split(" ")) {
      expect(container).toHaveClass(cls);
    }
    expect(table).toHaveClass("table-fixed");
    // Long content is truncated (truncate class) rather than expanding layout
    const nameCell = screen.getByTestId("project-row-proj-long").querySelector("td:first-child");
    expect(nameCell).toHaveClass("truncate");
  });

  it("Create project button is horizontally centered", async () => {
    mockProjectsList.mockResolvedValue([]);

    renderHomeScreen();

    await screen.findByTestId("create-project-row");
    const createRow = screen.getByTestId("create-project-row");
    const td = createRow.querySelector("td");
    expect(td).toHaveClass("text-center");
  });

  it("clicking outside dropdown closes it", async () => {
    mockProjectsList.mockResolvedValue([mockProject]);
    const user = userEvent.setup();

    renderHomeScreen();

    await screen.findByText("My Project");
    await user.click(screen.getByTestId("project-row-menu-proj-1"));
    expect(screen.getByTestId("project-row-dropdown-proj-1")).toBeInTheDocument();

    await user.click(document.body);
    expect(screen.queryByTestId("project-row-dropdown-proj-1")).not.toBeInTheDocument();
  });
});
