import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ImageDropZone } from "./ImageDropZone";

const mockOnDragOver = vi.fn();
const mockOnDrop = vi.fn();

describe("ImageDropZone", () => {
  beforeEach(() => {
    mockOnDragOver.mockClear();
    mockOnDrop.mockClear();
  });

  it("renders children when not dragging", () => {
    render(
      <ImageDropZone
        variant="main"
        isDraggingImage={false}
        onDragOver={mockOnDragOver}
        onDrop={mockOnDrop}
        data-testid="main-drop"
      >
        <div>Feedback input</div>
      </ImageDropZone>
    );

    expect(screen.getByText("Feedback input")).toBeInTheDocument();
    expect(screen.queryByText("Drop here for new feedback")).not.toBeInTheDocument();
  });

  it("shows main feedback overlay when dragging image", () => {
    render(
      <ImageDropZone
        variant="main"
        isDraggingImage={true}
        onDragOver={mockOnDragOver}
        onDrop={mockOnDrop}
        data-testid="main-drop"
      >
        <div>Feedback input</div>
      </ImageDropZone>
    );

    expect(screen.getByText("Drop here for new feedback")).toBeInTheDocument();
    expect(screen.getByTestId("main-drop-drop-overlay")).toBeInTheDocument();
  });

  it("shows reply overlay when dragging image and variant is reply", () => {
    render(
      <ImageDropZone
        variant="reply"
        isDraggingImage={true}
        onDragOver={mockOnDragOver}
        onDrop={mockOnDrop}
        data-testid="reply-drop"
      >
        <div>Reply input</div>
      </ImageDropZone>
    );

    expect(screen.getByText("Drop here for reply")).toBeInTheDocument();
    expect(screen.getByTestId("reply-drop-drop-overlay")).toBeInTheDocument();
  });

  it("calls onDragOver when dragging over", () => {
    render(
      <ImageDropZone
        variant="main"
        isDraggingImage={false}
        onDragOver={mockOnDragOver}
        onDrop={mockOnDrop}
        data-testid="main-drop"
      >
        <div>Feedback input</div>
      </ImageDropZone>
    );

    const zone = screen.getByTestId("main-drop");
    // Fire dragOver programmatically (userEvent doesn't support drag)
    const dragEvent = new Event("dragover", {
      bubbles: true,
      cancelable: true,
    }) as DragEvent;
    Object.defineProperty(dragEvent, "dataTransfer", {
      value: { types: [], items: [] },
      writable: false,
    });
    zone.dispatchEvent(dragEvent);

    expect(mockOnDragOver).toHaveBeenCalledTimes(1);
  });

  it("applies custom className", () => {
    const { container } = render(
      <ImageDropZone
        variant="main"
        isDraggingImage={false}
        onDragOver={mockOnDragOver}
        onDrop={mockOnDrop}
        className="card p-5"
        data-testid="main-drop"
      >
        <div>Content</div>
      </ImageDropZone>
    );

    const zone = container.querySelector('[data-testid="main-drop"]');
    expect(zone).toHaveClass("card");
    expect(zone).toHaveClass("p-5");
  });
});
