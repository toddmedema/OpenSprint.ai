/**
 * Detects if the user is on macOS for keyboard shortcut display.
 * Uses navigator.platform, navigator.userAgent, and navigator.userAgentData when available.
 */
export function isMac(): boolean {
  if (typeof navigator === "undefined") return false;
  const platform = navigator.platform?.toLowerCase() ?? "";
  const ua = navigator.userAgent?.toLowerCase() ?? "";
  const uaData = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData;
  const uaDataPlatform = uaData?.platform?.toLowerCase() ?? "";
  return platform.includes("mac") || ua.includes("mac") || uaDataPlatform === "macos";
}

/**
 * Returns the keyboard shortcut label for submitting (multiline: Enter or Cmd/Ctrl+Enter; Shift+Enter for newline).
 * - macOS: "Enter or Cmd + Enter to submit · Shift+Enter for new line"
 * - Windows/Linux/other: "Enter or Ctrl + Enter to submit · Shift+Enter for new line"
 */
export function getSubmitShortcutLabel(): string {
  return isMac()
    ? "Enter or Cmd + Enter to submit · Shift+Enter for new line"
    : "Enter or Ctrl + Enter to submit · Shift+Enter for new line";
}
