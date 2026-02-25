import "@testing-library/jest-dom/vitest";

// ResizeObserver is not available in jsdom; mock for components that use it (e.g. PrdChatPanel, DependencyGraph)
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
