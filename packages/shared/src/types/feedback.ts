/** Feedback categorization */
export type FeedbackCategory = 'bug' | 'feature' | 'ux' | 'scope';

/** Feedback resolution status */
export type FeedbackStatus = 'pending' | 'mapped' | 'resolved';

/** Feedback item stored at .opensprint/feedback/<id>.json */
export interface FeedbackItem {
  id: string;
  text: string;
  category: FeedbackCategory;
  mappedPlanId: string | null;
  createdTaskIds: string[];
  status: FeedbackStatus;
  createdAt: string;
  /** Suggested task titles from AI categorization */
  taskTitles?: string[];
}
