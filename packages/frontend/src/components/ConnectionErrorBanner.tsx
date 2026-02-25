import { useAppSelector } from "../store";

const MESSAGE = "Failed to connect to Open Sprint server - try restarting it";

/** Global, non-closable banner shown when fetch/WebSocket cannot reach the server. */
export function ConnectionErrorBanner() {
  const connectionError = useAppSelector((s) => s.connection?.connectionError ?? false);

  if (!connectionError) return null;

  return (
    <div
      className="flex items-center justify-center bg-theme-error-bg px-4 py-3 text-theme-error-text border-b border-theme-error-border shrink-0"
      data-testid="connection-error-banner"
      role="alert"
    >
      <p className="text-sm font-medium">{MESSAGE}</p>
    </div>
  );
}
