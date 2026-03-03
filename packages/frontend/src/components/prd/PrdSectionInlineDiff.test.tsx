import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PrdSectionInlineDiff } from "./PrdSectionInlineDiff";

describe("PrdSectionInlineDiff", () => {
  it("renders diff with removed and added lines", () => {
    render(
      <PrdSectionInlineDiff
        currentContent="1. Web dashboard"
        proposedUpdate={{
          section: "feature_list",
          changeLogEntry: "Add mobile app",
          content: "1. Web dashboard\n2. Mobile app",
        }}
      />
    );

    expect(screen.getByTestId("prd-inline-diff-feature_list")).toBeInTheDocument();
    expect(screen.getByText("Add mobile app")).toBeInTheDocument();
    expect(screen.getByText(/1\. Web dashboard/)).toBeInTheDocument();
    expect(screen.getByText(/2\. Mobile app/)).toBeInTheDocument();
  });

  it("renders when changeLogEntry is omitted", () => {
    render(
      <PrdSectionInlineDiff
        currentContent="Old"
        proposedUpdate={{
          section: "overview",
          content: "New",
        }}
      />
    );

    expect(screen.getByTestId("prd-inline-diff-overview")).toBeInTheDocument();
  });

  it("renders (No content) when both current and proposed are empty", () => {
    render(
      <PrdSectionInlineDiff
        currentContent=""
        proposedUpdate={{
          section: "empty_section",
          content: "",
        }}
      />
    );

    expect(screen.getByText("(No content)")).toBeInTheDocument();
  });
});
