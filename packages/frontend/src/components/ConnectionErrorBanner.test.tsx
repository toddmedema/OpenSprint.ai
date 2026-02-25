import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import connectionReducer from "../store/slices/connectionSlice";
import { ConnectionErrorBanner } from "./ConnectionErrorBanner";

function renderWithStore(connectionError: boolean) {
  const store = configureStore({
    reducer: { connection: connectionReducer },
    preloadedState: { connection: { connectionError } },
  });
  return render(
    <Provider store={store}>
      <ConnectionErrorBanner />
    </Provider>
  );
}

describe("ConnectionErrorBanner", () => {
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

  it("banner has no dismiss button (non-closable)", () => {
    renderWithStore(true);
    const banner = screen.getByTestId("connection-error-banner");
    expect(banner.querySelector("button")).toBeNull();
  });

  it("banner has role alert", () => {
    renderWithStore(true);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
