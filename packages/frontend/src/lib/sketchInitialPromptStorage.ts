import { MAX_STORED_IMAGES_BYTES } from "./feedbackFormStorage";

const PREFIX = "opensprint-sketch-initial-draft";

export interface SketchInitialPromptDraft {
  text: string;
  images: string[];
}

function storageKey(projectId: string): string {
  return `${PREFIX}-${projectId}`;
}

function estimateBase64Size(str: string): number {
  return str.length;
}

export function loadSketchInitialPromptDraft(projectId: string): SketchInitialPromptDraft {
  if (typeof window === "undefined") return { text: "", images: [] };
  try {
    const stored = localStorage.getItem(storageKey(projectId));
    if (!stored) return { text: "", images: [] };
    const parsed = JSON.parse(stored) as unknown;
    if (parsed === null || typeof parsed !== "object") return { text: "", images: [] };
    const obj = parsed as Record<string, unknown>;
    const text = typeof obj.text === "string" ? obj.text : "";
    const imagesRaw = obj.images;
    const images: string[] = [];
    if (Array.isArray(imagesRaw)) {
      let totalBytes = 0;
      for (const item of imagesRaw) {
        if (typeof item !== "string" || !item.startsWith("data:image/")) continue;
        const size = estimateBase64Size(item);
        if (totalBytes + size > MAX_STORED_IMAGES_BYTES) break;
        images.push(item);
        totalBytes += size;
      }
    }
    return { text, images };
  } catch {
    return { text: "", images: [] };
  }
}

export function saveSketchInitialPromptDraft(projectId: string, draft: SketchInitialPromptDraft): void {
  if (typeof window === "undefined") return;
  try {
    const images = draft.images ?? [];
    let totalBytes = 0;
    const truncated: string[] = [];
    for (const img of images) {
      if (typeof img !== "string" || !img.startsWith("data:image/")) continue;
      const size = estimateBase64Size(img);
      if (totalBytes + size > MAX_STORED_IMAGES_BYTES) break;
      truncated.push(img);
      totalBytes += size;
    }
    const rawText = typeof draft.text === "string" ? draft.text : "";
    if (!rawText.trim() && truncated.length === 0) {
      clearSketchInitialPromptDraft(projectId);
      return;
    }
    const toStore: SketchInitialPromptDraft = {
      text: rawText,
      images: truncated,
    };
    localStorage.setItem(storageKey(projectId), JSON.stringify(toStore));
  } catch {
    // ignore
  }
}

export function clearSketchInitialPromptDraft(projectId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(storageKey(projectId));
  } catch {
    // ignore
  }
}
