import { describe, it, expect } from "vitest";
import { renderBootHtml, BOOT_DRAG_TOP_HEIGHT_PX } from "./boot-screen";

const APP_NAME = "Open Sprint";

describe("renderBootHtml", () => {
  it("escapes status text in the document", () => {
    const html = renderBootHtml("Starting backend...", APP_NAME, "darwin");
    expect(html).toContain("Starting backend...");
    expect(html).not.toContain("<script>");
    const withAmp = renderBootHtml("A & B", APP_NAME, "linux");
    expect(withAmp).toContain("&amp;");
  });

  it("on darwin includes a draggable top region with -webkit-app-region: drag", () => {
    const html = renderBootHtml("Starting backend...", APP_NAME, "darwin");
    expect(html).toContain('class="boot-drag-top"');
    expect(html).toContain("-webkit-app-region: drag");
    expect(html).toContain("width: 100%");
    expect(html).toContain(`height: ${BOOT_DRAG_TOP_HEIGHT_PX}px`);
    expect(html).toContain('aria-hidden="true"');
  });

  it("on darwin includes exactly one boot-drag-top div in body", () => {
    const html = renderBootHtml("Loading", APP_NAME, "darwin");
    const match = html.match(/<body>[\s\S]*?<div class="boot-drag-top"/);
    expect(match).toBeTruthy();
    const count = (html.match(/boot-drag-top/g) ?? []).length;
    expect(count).toBe(2); // class name + CSS selector
  });

  it("on non-darwin platforms omits the draggable top region div from body", () => {
    const htmlWin = renderBootHtml("Starting backend...", APP_NAME, "win32");
    expect(htmlWin).not.toContain('<div class="boot-drag-top"');
    const htmlLinux = renderBootHtml("Starting backend...", APP_NAME, "linux");
    expect(htmlLinux).not.toContain('<div class="boot-drag-top"');
  });

  it("uses provided app name in title and heading", () => {
    const html = renderBootHtml("Status", "My App", "darwin");
    expect(html).toContain("<title>My App</title>");
    expect(html).toContain('<h1 class="title">My App</h1>');
  });

  it("shows a single status row with spinner left of the status text", () => {
    const html = renderBootHtml("Starting backend...", APP_NAME, "darwin");
    expect(html).toContain('class="boot-status-row"');
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).not.toContain("Preparing local services");
    const rowMatch = html.match(
      /class="boot-status-row"[\s\S]*?class="spinner"[\s\S]*?Starting backend/
    );
    expect(rowMatch).toBeTruthy();
    expect((html.match(/class="status"/g) ?? []).length).toBe(1);
  });

  it("BOOT_DRAG_TOP_HEIGHT_PX matches main app navbar height (48)", () => {
    expect(BOOT_DRAG_TOP_HEIGHT_PX).toBe(48);
  });
});
