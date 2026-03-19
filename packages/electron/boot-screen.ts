import { DESKTOP_TOP_BAR_HEIGHT } from "./window-options";

/** Height of the draggable top region on the loading page (matches main app top bar). */
export const BOOT_DRAG_TOP_HEIGHT_PX = DESKTOP_TOP_BAR_HEIGHT;

/**
 * Renders the boot/loading page HTML. On macOS (darwin), includes a top area
 * with -webkit-app-region: drag so the window can be moved while loading.
 */
export function renderBootHtml(
  statusText: string,
  appName: string,
  platform: NodeJS.Platform
): string {
  const escaped = statusText
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  const isMac = platform === "darwin";
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${appName}</title>
    <style>
      :root {
        color-scheme: dark;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      html, body {
        margin: 0;
        width: 100%;
        height: 100%;
        min-height: 100vh;
        overflow: hidden;
        box-sizing: border-box;
        background: radial-gradient(circle at top, #1e293b 0%, #020617 60%);
        color: #e2e8f0;
      }
      body {
        display: flex;
        flex-direction: column;
      }
      *, *::before, *::after { box-sizing: inherit; }
      .boot-drag-top {
        width: 100%;
        height: ${BOOT_DRAG_TOP_HEIGHT_PX}px;
        min-height: ${BOOT_DRAG_TOP_HEIGHT_PX}px;
        flex-shrink: 0;
        -webkit-app-region: drag;
        app-region: drag;
      }
      .boot {
        flex: 1;
        min-height: 0;
        display: grid;
        place-items: center;
        padding: 24px;
        overflow: hidden;
      }
      .card {
        width: min(420px, 100%);
        border: 1px solid rgba(148, 163, 184, 0.35);
        border-radius: 12px;
        background: rgba(15, 23, 42, 0.75);
        padding: 24px;
        backdrop-filter: blur(3px);
      }
      .title {
        margin: 0 0 8px;
        font-size: 20px;
        font-weight: 600;
      }
      .status {
        margin: 0;
        color: #cbd5e1;
        font-size: 14px;
      }
      .row {
        margin-top: 16px;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(148, 163, 184, 0.45);
        border-top-color: #38bdf8;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    </style>
  </head>
  <body>
    ${isMac ? '<div class="boot-drag-top" aria-hidden="true"></div>' : ""}
    <main class="boot">
      <section class="card">
        <h1 class="title">${appName}</h1>
        <p class="status">${escaped}</p>
        <div class="row">
          <div class="spinner" aria-hidden="true"></div>
          <p class="status">Preparing local services...</p>
        </div>
      </section>
    </main>
  </body>
</html>`;
}
