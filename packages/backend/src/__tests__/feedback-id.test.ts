import { describe, expect, it } from "vitest";
import { generateShortFeedbackId } from "../utils/feedback-id.js";

describe("generateShortFeedbackId", () => {
  it.each([
    "matches the lowercase alphanumeric format",
    "keeps the id at six characters",
    "does not emit punctuation or uppercase characters",
  ])("%s", () => {
    const id = generateShortFeedbackId();

    expect(id).toHaveLength(6);
    expect(id).toMatch(/^[a-z0-9]{6}$/);
  });
});
