import { useEffect, useRef, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../store";
import {
  dismissNotification,
  type Notification,
  type NotificationSeverity,
} from "../store/slices/notificationSlice";

/** Navbar height in px — used to position the fixed bar below it. */
const NAVBAR_HEIGHT = 56;

const SEVERITY_STYLES: Record<
  NotificationSeverity,
  { light: string; dark: string }
> = {
  error: {
    light: "bg-red-600 text-white border-red-700",
    dark: "dark:bg-red-700 dark:border-red-800",
  },
  warning: {
    light: "bg-amber-600 text-white border-amber-700",
    dark: "dark:bg-amber-700 dark:border-amber-800",
  },
  info: {
    light: "bg-blue-600 text-white border-blue-700",
    dark: "dark:bg-blue-700 dark:border-blue-800",
  },
  success: {
    light: "bg-emerald-600 text-white border-emerald-700",
    dark: "dark:bg-emerald-700 dark:border-emerald-800",
  },
};

function NotificationItem({
  notification,
  onDismiss,
}: {
  notification: Notification;
  onDismiss: () => void;
}) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const styles = SEVERITY_STYLES[notification.severity];

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
        flex items-center justify-between gap-3 px-4 py-3 rounded-lg border shadow-sm
        animate-[slide-up-fade_0.25s_ease-out]
        ${styles.light} ${styles.dark}
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
  const items = useAppSelector((s) => s.notification.items);

  if (items.length === 0) return null;

  return (
    <div
      className="fixed left-0 right-0 z-50 flex flex-col gap-2 px-4 py-2"
      style={{ top: NAVBAR_HEIGHT }}
      role="region"
      aria-label="Notifications"
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
