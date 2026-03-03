import { describe, it, expect, vi, afterEach } from "vitest";
import { truncatePreview, formatNotificationTimestamp } from "./notificationUtils";

describe("notificationUtils", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("truncates previews at the requested length", () => {
    expect(truncatePreview("short text", 20)).toBe("short text");
    expect(truncatePreview("1234567890abcdef", 10)).toBe("1234567890…");
  });

  it("formats timestamps across relative time boundaries", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-03T12:00:00Z"));

    expect(formatNotificationTimestamp("2026-03-03T11:59:45Z")).toBe("Just now");
    expect(formatNotificationTimestamp("2026-03-03T11:45:00Z")).toBe("15m ago");
    expect(formatNotificationTimestamp("2026-03-03T09:00:00Z")).toBe("3h ago");
    expect(formatNotificationTimestamp("2026-03-01T12:00:00Z")).toBe("2d ago");
  });
});
