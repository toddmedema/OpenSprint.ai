import { useState, useEffect, useCallback } from "react";
import { ACCEPTED_IMAGE_TYPES } from "./useImageAttachment";

function hasImageFiles(dataTransfer: DataTransfer | null): boolean {
  if (!dataTransfer?.types) return false;
  const hasFiles = dataTransfer.types.includes("Files");
  if (!hasFiles) return false;
  const items = dataTransfer.items;
  if (!items?.length) return true; // Files type present, assume images possible
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.kind === "file" && ACCEPTED_IMAGE_TYPES.includes(item.type)) {
      return true;
    }
  }
  return false;
}

/**
 * Tracks when the user is dragging image files over the document.
 * Used to show drop zone overlays on the Evaluate page.
 */
export function useImageDragOverPage(): boolean {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = { current: 0 };

  const handleDragEnter = useCallback((e: DragEvent) => {
    if (!hasImageFiles(e.dataTransfer)) return;
    dragCounterRef.current++;
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    // Don't check dataTransfer in dragleave — it may be restricted. Decrement to balance dragenter.
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    dragCounterRef.current = 0;
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(() => {
    dragCounterRef.current = 0;
    setIsDragging(false);
  }, []);

  useEffect(() => {
    document.addEventListener("dragenter", handleDragEnter);
    document.addEventListener("dragleave", handleDragLeave);
    document.addEventListener("dragend", handleDragEnd);
    document.addEventListener("drop", handleDrop);
    return () => {
      document.removeEventListener("dragenter", handleDragEnter);
      document.removeEventListener("dragleave", handleDragLeave);
      document.removeEventListener("dragend", handleDragEnd);
      document.removeEventListener("drop", handleDrop);
    };
  }, [handleDragEnter, handleDragLeave, handleDragEnd, handleDrop]);

  return isDragging;
}
