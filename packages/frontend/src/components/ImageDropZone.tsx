import type { ReactNode } from "react";

export type ImageDropZoneVariant = "main" | "reply";

export interface ImageDropZoneProps {
  /** "main" = main feedback input, "reply" = reply to feedback */
  variant: ImageDropZoneVariant;
  /** Whether an image is currently being dragged over the page */
  isDraggingImage: boolean;
  /** Drop handlers — pass through from useImageAttachment */
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => Promise<void>;
  children: ReactNode;
  className?: string;
  "data-testid"?: string;
}

/**
 * Wraps a drop target for image attachments. When the user drags an image over the page,
 * shows a visible overlay indicating this is a valid drop zone. Main feedback vs reply
 * are visually differentiated.
 */
export function ImageDropZone({
  variant,
  isDraggingImage,
  onDragOver,
  onDrop,
  children,
  className = "",
  "data-testid": dataTestId,
}: ImageDropZoneProps) {
  const label = variant === "main" ? "Drop here for new feedback" : "Drop here for reply";

  const overlayClasses =
    variant === "main"
      ? "ring-2 ring-theme-info-border bg-theme-info-bg/80"
      : "ring-2 ring-theme-success-border bg-theme-success-bg/80";

  return (
    <div
      className={`relative ${className}`.trim()}
      onDragOver={onDragOver}
      onDrop={onDrop}
      data-testid={dataTestId}
    >
      {children}
      {isDraggingImage && (
        <div
          className={`absolute inset-0 rounded-xl flex items-center justify-center pointer-events-none z-10 ${overlayClasses}`}
          aria-hidden="true"
          data-testid={dataTestId ? `${dataTestId}-drop-overlay` : undefined}
        >
          <span
            className={`text-sm font-medium px-3 py-1.5 rounded-lg ${
              variant === "main"
                ? "bg-theme-info-bg text-theme-info-text ring-1 ring-theme-info-border"
                : "bg-theme-success-bg text-theme-success-text ring-1 ring-theme-success-border"
            }`}
          >
            {label}
          </span>
        </div>
      )}
    </div>
  );
}
