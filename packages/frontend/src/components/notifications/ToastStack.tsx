import type { ReactNode } from "react";
import { NAVBAR_HEIGHT } from "../../lib/constants";

interface ToastStackProps {
  children: ReactNode;
  testId?: string;
}

export function ToastStack({ children, testId }: ToastStackProps) {
  return (
    <div
      className="fixed right-4 z-50 flex w-[min(420px,calc(100vw-2rem))] flex-col gap-2"
      style={{ top: NAVBAR_HEIGHT + 8 }}
      role="region"
      aria-label="Notifications"
      data-testid={testId ?? "notification-toast-stack"}
    >
      {children}
    </div>
  );
}
