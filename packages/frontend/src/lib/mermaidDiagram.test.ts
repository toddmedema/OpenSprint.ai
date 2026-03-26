import { beforeEach, describe, expect, it, vi } from "vitest";
import { OS_MERMAID_ATTR, OS_MERMAID_CLASS, OS_MERMAID_SVG_CLASS } from "./markdownUtils";
import { encodeMermaidSourceForAttr, renderMermaidDiagrams } from "./mermaidDiagram";

const mermaidMock = vi.hoisted(() => ({
  initialize: vi.fn(),
  render: vi.fn(),
  parseError: undefined as unknown,
}));

vi.mock("mermaid", () => ({
  default: mermaidMock,
}));

describe("renderMermaidDiagrams", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mermaidMock.parseError = undefined;
  });

  it("suppresses Mermaid global error rendering and sets parseError handler", async () => {
    mermaidMock.render.mockResolvedValue({ svg: "<svg><g>ok</g></svg>" });

    const root = document.createElement("div");
    const source = "flowchart LR\n  A-->B";
    root.innerHTML = `<div class="${OS_MERMAID_CLASS}" ${OS_MERMAID_ATTR}="${encodeMermaidSourceForAttr(source)}"><div class="${OS_MERMAID_SVG_CLASS}"></div></div>`;

    await renderMermaidDiagrams(root, "light");

    expect(mermaidMock.initialize).toHaveBeenCalledWith(
      expect.objectContaining({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "default",
        suppressErrorRendering: true,
      })
    );
    expect(typeof mermaidMock.parseError).toBe("function");
    expect((mermaidMock.parseError as () => void)()).toBeUndefined();
    expect(root.querySelector(`.${OS_MERMAID_SVG_CLASS}`)?.innerHTML).toContain("<svg>");
  });

  it("renders a local fallback message when diagram render fails", async () => {
    mermaidMock.render.mockRejectedValue(new Error("parse failed"));

    const root = document.createElement("div");
    const source = "flowchart LR\n  A-->B";
    root.innerHTML = `<div class="${OS_MERMAID_CLASS}" ${OS_MERMAID_ATTR}="${encodeMermaidSourceForAttr(source)}"><div class="${OS_MERMAID_SVG_CLASS}"></div></div>`;

    await renderMermaidDiagrams(root, "dark");

    expect(root.querySelector(`.${OS_MERMAID_SVG_CLASS}`)?.textContent).toContain(
      "Diagram could not be rendered"
    );
  });
});
