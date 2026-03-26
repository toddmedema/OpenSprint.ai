import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { PrdSectionEditor } from "./PrdSectionEditor";

const mermaidMock = vi.hoisted(() => ({
  initialize: vi.fn(),
  render: vi.fn(),
  parseError: undefined as unknown,
}));

vi.mock("mermaid", () => ({
  default: mermaidMock,
}));

describe("PrdSectionEditor mermaid rendering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mermaidMock.parseError = undefined;
  });

  it("shows local fallback for invalid mermaid without crashing the editor", async () => {
    mermaidMock.render.mockRejectedValue(new Error("invalid mermaid"));

    render(
      <PrdSectionEditor
        sectionKey="technical_approach"
        markdown={"```mermaid\nflowchart LR\nA-->\n```"}
        onSave={vi.fn()}
        diagrams="mermaid"
      />
    );

    expect(await screen.findByText("Diagram could not be rendered")).toBeInTheDocument();
    expect(mermaidMock.initialize).toHaveBeenCalledWith(
      expect.objectContaining({ suppressErrorRendering: true })
    );
  });
});
