import React from "react";
import { SourceFeedbackSection } from "./SourceFeedbackSection";

export interface TaskDetailFeedbackSectionsProps {
  projectId: string;
  feedbackIds: string[];
  sourceFeedbackExpanded: Record<string, boolean>;
  setSourceFeedbackExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export function TaskDetailFeedbackSections({
  projectId,
  feedbackIds,
  sourceFeedbackExpanded,
  setSourceFeedbackExpanded,
}: TaskDetailFeedbackSectionsProps) {
  const toggleCallbacks = React.useMemo(() => {
    const map: Record<string, () => void> = {};
    feedbackIds.forEach((feedbackId, index) => {
      map[feedbackId] = () =>
        setSourceFeedbackExpanded((prev) => ({
          ...prev,
          [feedbackId]: !(prev[feedbackId] ?? index === 0),
        }));
    });
    return map;
  }, [feedbackIds, setSourceFeedbackExpanded]);

  if (feedbackIds.length === 0) return null;

  return (
    <>
      {feedbackIds.map((feedbackId, index) => (
        <SourceFeedbackSection
          key={feedbackId}
          projectId={projectId}
          feedbackId={feedbackId}
          expanded={sourceFeedbackExpanded[feedbackId] ?? index === 0}
          onToggle={toggleCallbacks[feedbackId] ?? (() => {})}
          title={
            feedbackIds.length > 1
              ? `Source feedback (${index + 1} of ${feedbackIds.length})`
              : "Source Feedback"
          }
        />
      ))}
    </>
  );
}
