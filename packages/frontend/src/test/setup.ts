import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";

const SUPPRESSED_TEST_WARNING_PATTERNS = [
  /^An update to .* inside a test was not wrapped in act/,
  /^A suspended resource finished loading inside a test, but the event was not wrapped in act/,
  /^Selector unknown returned a different result when called with the same parameters\./,
];

function shouldSuppressKnownTestNoise(args: unknown[]): boolean {
  if (args.length === 0) return false;
  const [firstArg] = args;
  if (typeof firstArg !== "string") return false;
  return SUPPRESSED_TEST_WARNING_PATTERNS.some((pattern) => pattern.test(firstArg));
}

const originalConsoleError = console.error.bind(console);
console.error = (...args: Parameters<typeof console.error>) => {
  if (shouldSuppressKnownTestNoise(args)) return;
  originalConsoleError(...args);
};

const originalConsoleWarn = console.warn.bind(console);
console.warn = (...args: Parameters<typeof console.warn>) => {
  if (shouldSuppressKnownTestNoise(args)) return;
  originalConsoleWarn(...args);
};

afterEach(() => {
  vi.useRealTimers();
});

// ResizeObserver is not available in jsdom; mock for components that use it (e.g. PrdChatPanel, DependencyGraph)
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

// IntersectionObserver is not available in jsdom; mock for components that use it (e.g. PrdTocPanel)
if (typeof globalThis.IntersectionObserver === "undefined") {
  globalThis.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver;
}

if (typeof window !== "undefined" && typeof window.matchMedia === "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: false,
      media: "",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}
