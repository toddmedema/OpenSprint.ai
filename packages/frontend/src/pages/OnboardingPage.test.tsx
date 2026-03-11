import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { OnboardingPage } from "./OnboardingPage";
import { renderApp } from "../test/test-utils";

vi.mock("../components/layout/Layout", () => ({
  Layout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

function renderOnboarding(routeEntries: string[] = ["/onboarding"]) {
  return renderApp(
    <Routes>
      <Route path="/onboarding" element={<OnboardingPage />} />
    </Routes>,
    { routeEntries }
  );
}

describe("OnboardingPage", () => {
  it("renders full-page layout with title Initial Setup", () => {
    renderOnboarding();

    expect(screen.getByTestId("onboarding-page")).toBeInTheDocument();
    expect(screen.getByTestId("onboarding-title")).toHaveTextContent("Initial Setup");
    expect(screen.getByTestId("layout")).toBeInTheDocument();
  });

  it("renders Prerequisites placeholder section", () => {
    renderOnboarding();

    const section = screen.getByTestId("onboarding-prerequisites");
    expect(section).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Prerequisites" })).toBeInTheDocument();
  });

  it("renders Agent setup placeholder section", () => {
    renderOnboarding();

    const section = screen.getByTestId("onboarding-agent-setup");
    expect(section).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Agent setup" })).toBeInTheDocument();
  });

  it("supports optional intended query param", () => {
    renderOnboarding(["/onboarding?intended=/projects/create-new"]);

    expect(screen.getByTestId("onboarding-intended")).toHaveTextContent(
      "Intended destination: /projects/create-new"
    );
  });

  it("does not show intended when query param is absent", () => {
    renderOnboarding(["/onboarding"]);

    expect(screen.queryByTestId("onboarding-intended")).not.toBeInTheDocument();
  });
});
