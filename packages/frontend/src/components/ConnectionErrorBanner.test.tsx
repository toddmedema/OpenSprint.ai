import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import connectionReducer from "../store/slices/connectionSlice";
import { ConnectionErrorBanner } from "./ConnectionErrorBanner";

const mockDbStatusGet = vi.fn();
vi.mock("../api/client", () => ({
  api: {
    dbStatus: {
      get: (...args: unknown[]) => mockDbStatusGet(...args),
    },
  },
}));

function renderWithStore(connectionError: boolean, lastRecoveredAt?: number | null) {
  const store = configureStore({
    reducer: { connection: connectionReducer },
    preloadedState: {
      connection: { connectionError, lastRecoveredAt: lastRecoveredAt ?? null },
    },
  });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <ConnectionErrorBanner />
      </Provider>
    </QueryClientProvider>
  );
}

describe("ConnectionErrorBanner", () => {
  beforeEach(() => {
    mockDbStatusGet.mockReset();
    // Default: never resolve so banner stays visible in tests that only assert static render
    mockDbStatusGet.mockReturnValue(new Promise(() => {}));
  });

  it("renders nothing when connectionError is false", () => {
    renderWithStore(false);
    expect(screen.queryByTestId("connection-error-banner")).not.toBeInTheDocument();
  });

  it("renders banner with exact message when connectionError is true", () => {
    renderWithStore(true);
    const banner = screen.getByTestId("connection-error-banner");
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent("Failed to connect to Open Sprint server - try restarting it");
  });

  it("shows countdown text 'Checking again in Xs'", () => {
    renderWithStore(true);
    expect(screen.getByText(/Checking again in \d+s/)).toBeInTheDocument();
  });

  it("banner has Check again button but no dismiss/close button (non-closable)", () => {
    renderWithStore(true);
    const checkAgainBtn = screen.getByRole("button", { name: "Check again" });
    expect(checkAgainBtn).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /dismiss|close/i })).not.toBeInTheDocument();
  });

  it("banner has role alert", () => {
    renderWithStore(true);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("auto-dismisses banner when backend becomes reachable (recovery poll succeeds)", async () => {
    mockDbStatusGet.mockResolvedValue({ ok: true, state: "connected", lastCheckedAt: null });
    const store = configureStore({
      reducer: { connection: connectionReducer },
      preloadedState: { connection: { connectionError: true, lastRecoveredAt: null } },
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <ConnectionErrorBanner />
        </Provider>
      </QueryClientProvider>
    );
    expect(screen.getByTestId("connection-error-banner")).toBeInTheDocument();
    await waitFor(() => {
      expect(store.getState().connection.connectionError).toBe(false);
    });
    expect(screen.queryByTestId("connection-error-banner")).not.toBeInTheDocument();
  });

  it("Check again button triggers immediate poll", async () => {
    mockDbStatusGet.mockRejectedValue(new Error("Failed to fetch"));
    renderWithStore(true);
    const initialCalls = mockDbStatusGet.mock.calls.length;
    expect(initialCalls).toBeGreaterThanOrEqual(1);

    const checkAgainBtn = screen.getByRole("button", { name: "Check again" });
    await userEvent.click(checkAgainBtn);

    await waitFor(() => {
      expect(mockDbStatusGet.mock.calls.length).toBeGreaterThan(initialCalls);
    });
  });

  it("Check again button resets countdown to 3s", async () => {
    mockDbStatusGet.mockRejectedValue(new Error("Failed to fetch"));
    renderWithStore(true);
    const checkAgainBtn = screen.getByRole("button", { name: "Check again" });
    await userEvent.click(checkAgainBtn);
    expect(screen.getByText(/Checking again in 3s/)).toBeInTheDocument();
  });

  it("keeps polling until backend responds when connectionError is true", async () => {
    mockDbStatusGet
      .mockRejectedValueOnce(new Error("Failed to fetch"))
      .mockResolvedValueOnce({ ok: true, state: "connected", lastCheckedAt: null });
    const store = configureStore({
      reducer: { connection: connectionReducer },
      preloadedState: { connection: { connectionError: true, lastRecoveredAt: null } },
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <ConnectionErrorBanner />
        </Provider>
      </QueryClientProvider>
    );
    await waitFor(
      () => {
        expect(store.getState().connection.connectionError).toBe(false);
      },
      { timeout: 5000 }
    );
    expect(mockDbStatusGet).toHaveBeenCalled();
  });
});
