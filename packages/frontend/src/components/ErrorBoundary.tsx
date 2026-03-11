import React from "react";
import { CriticalStateView } from "./CriticalStateView";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Catches uncaught render errors in the tree and shows a fallback UI
 * so the app does not unmount entirely.
 * Uses CriticalStateView: one h1, one primary action, aria-describedby for screen readers.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <CriticalStateView
          data-testid="error-boundary"
          heading="Something went wrong"
          summary="An unexpected error occurred. Reload the page to try again."
          primaryAction={
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-primary inline-flex"
            >
              Reload
            </button>
          }
          role="alert"
          className="min-h-screen bg-theme-surface"
        />
      );
    }
    return this.props.children;
  }
}
