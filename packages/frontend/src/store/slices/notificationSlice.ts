import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type NotificationSeverity = "error" | "warning" | "info" | "success";

export interface Notification {
  id: string;
  message: string;
  severity: NotificationSeverity;
  /** Auto-dismiss timeout in ms. 0 = persistent. Default: 8000 for info/success, 0 for error/warning. */
  timeout?: number;
  createdAt: number;
}

export interface AddNotificationPayload {
  message: string;
  severity?: NotificationSeverity;
  /** Override auto-dismiss. 0 = persistent. */
  timeout?: number;
}

const DEFAULT_AUTO_DISMISS_MS = 8000;

function nextId(): string {
  return `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getDefaultTimeout(severity: NotificationSeverity): number {
  return severity === "error" || severity === "warning" ? 0 : DEFAULT_AUTO_DISMISS_MS;
}

export interface NotificationState {
  items: Notification[];
}

const initialState: NotificationState = {
  items: [],
};

export const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    addNotification(state, action: PayloadAction<AddNotificationPayload>) {
      const { message, severity = "info", timeout } = action.payload;
      const effectiveTimeout = timeout !== undefined ? timeout : getDefaultTimeout(severity);
      state.items.push({
        id: nextId(),
        message,
        severity,
        timeout: effectiveTimeout,
        createdAt: Date.now(),
      });
    },
    dismissNotification(state, action: PayloadAction<string>) {
      state.items = state.items.filter((n) => n.id !== action.payload);
    },
    clearAllNotifications(state) {
      state.items = [];
    },
  },
});

export const { addNotification, dismissNotification, clearAllNotifications } =
  notificationSlice.actions;
