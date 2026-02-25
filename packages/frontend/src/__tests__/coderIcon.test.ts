import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CODER_SVG_PATH = resolve(__dirname, "../../public/agent-icons/coder.svg");

describe("coder.svg", () => {
  it("exists and is valid SVG", () => {
    const content = readFileSync(CODER_SVG_PATH, "utf-8");
    expect(content).toContain("<svg");
    expect(content).toContain("</svg>");
  });

  it("steam paths use same stroke color and stroke-width as mug outline", () => {
    const content = readFileSync(CODER_SVG_PATH, "utf-8");
    const mugStroke = "#818cf8";
    const mugStrokeWidth = "2.5";

    // Steam paths: three curved paths above the mug (M x 20 C ...)
    const steamPathRegex = /<path[^>]*d="M \d+ 20 C[^"]*"[^>]*\/>/g;
    const steamPaths = content.match(steamPathRegex) ?? [];
    expect(steamPaths.length).toBe(3);

    for (const path of steamPaths) {
      expect(path).toContain(`stroke="${mugStroke}"`);
      expect(path).toContain(`stroke-width="${mugStrokeWidth}"`);
      expect(path).not.toContain("opacity=");
    }
  });

  it("mug outline uses stroke #818cf8 and stroke-width 2.5", () => {
    const content = readFileSync(CODER_SVG_PATH, "utf-8");
    expect(content).toContain('stroke="#818cf8"');
    expect(content).toContain('stroke-width="2.5"');
  });

  it("icon remains recognizable with steam and mug elements", () => {
    const content = readFileSync(CODER_SVG_PATH, "utf-8");
    expect(content).toContain("<!-- cup U -->");
    expect(content).toContain("<!-- rim -->");
    expect(content).toContain("<!-- handle -->");
    expect(content).toContain("<!-- steam -->");
  });
});
