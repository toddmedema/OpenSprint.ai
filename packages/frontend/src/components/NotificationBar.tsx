import { useCallback, useEffect, useMemo, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../store";
import {
  dismissNotification,
  type Notification,
  type NotificationSeverity,
} from "../store/slices/notificationSlice";
import { NAVBAR_HEIGHT } from "../lib/constants";

const SEVERITY_STYLES: Record<NotificationSeverity, string> = {
  error: "bg-theme-notification-error text-white border-theme-notification-error/70",
  warning: "bg-theme-notification-warning text-white border-theme-notification-warning/70",
  info: "bg-theme-notification-info text-white border-theme-notification-info/70",
  success: "bg-theme-notification-success text-white border-theme-notification-success/70",
};

function NotificationItem({
  notification,
  onDismiss,
}: {
  notification: Notification;
  onDismiss: () => void;
}) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const styleClass = SEVERITY_STYLES[notification.severity];

  useEffect(() => {
    if (notification.timeout && notification.timeout > 0) {
      timeoutRef.current = setTimeout(() => {
        onDismiss();
      }, notification.timeout);
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [notification.id, notification.timeout, onDismiss]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape" || e.key === " ") {
        e.preventDefault();
        onDismiss();
      }
    },
    [onDismiss]
  );

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`
        flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border shadow-lg backdrop-blur-sm
        animate-[slide-up-fade_0.25s_ease-out]
        ${styleClass}
      `}
      data-testid={`notification-${notification.severity}`}
    >
      <span className="flex-1 min-w-0 text-sm font-medium">{notification.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        onKeyDown={handleKeyDown}
        className="shrink-0 p-1 rounded hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        aria-label="Dismiss notification"
      >
        <span className="sr-only">Dismiss</span>
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function NotificationBar() {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((state) => state.notification.items);
  const items = useMemo(
    () => notifications.filter((item) => item.presentation !== "inline"),
    [notifications]
  );

  if (items.length === 0) return null;

  return (
    <div
      className="fixed right-4 z-50 flex w-[min(420px,calc(100vw-2rem))] flex-col gap-2"
      style={{ top: NAVBAR_HEIGHT + 8 }}
      role="region"
      aria-label="Notifications"
      data-testid="notification-toast-stack"
    >
      {items.map((n) => (
        <NotificationItem
          key={n.id}
          notification={n}
          onDismiss={() => dispatch(dismissNotification(n.id))}
        />
      ))}
    </div>
  );
}
