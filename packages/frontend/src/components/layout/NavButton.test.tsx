import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { NavButton } from "./NavButton";

describe("NavButton", () => {
  it("renders as button when onClick provided", () => {
    render(
      <NavButton active={false} onClick={vi.fn()}>
        Tab
      </NavButton>
    );
    const btn = screen.getByRole("button", { name: "Tab" });
    expect(btn).toBeInTheDocument();
  });

  it("renders as link when to provided", () => {
    render(
      <MemoryRouter>
        <NavButton active={false} to="/settings">
          Settings
        </NavButton>
      </MemoryRouter>
    );
    const link = screen.getByRole("link", { name: "Settings" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/settings");
  });

  it("applies active styling when active", () => {
    render(
      <NavButton active={true} onClick={vi.fn()}>
        Active
      </NavButton>
    );
    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("data-active", "true");
    expect(btn).toHaveClass("bg-brand-600", "text-white");
  });

  it("applies inactive styling when inactive", () => {
    render(
      <NavButton active={false} onClick={vi.fn()}>
        Inactive
      </NavButton>
    );
    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("data-active", "false");
    expect(btn).toHaveClass("text-theme-muted");
  });

  it("has ~36px height and rounded corners", () => {
    render(
      <NavButton active={false} onClick={vi.fn()}>
        Tab
      </NavButton>
    );
    const btn = screen.getByRole("button");
    expect(btn).toHaveClass("min-h-[36px]", "rounded-lg");
  });

  it("has no blue focus ring (uses theme-border for focus-visible)", () => {
    render(
      <NavButton active={false} onClick={vi.fn()}>
        Tab
      </NavButton>
    );
    const btn = screen.getByRole("button");
    expect(btn).toHaveClass("focus:outline-none", "focus-visible:ring-theme-border");
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <NavButton active={false} onClick={onClick}>
        Tab
      </NavButton>
    );
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("icon variant adds aspect-square", () => {
    render(
      <NavButton active={true} variant="icon" onClick={vi.fn()}>
        ?
      </NavButton>
    );
    const btn = screen.getByRole("button");
    expect(btn).toHaveClass("aspect-square");
  });
});
