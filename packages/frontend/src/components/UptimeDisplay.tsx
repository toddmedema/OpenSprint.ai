import { formatUptime } from "../lib/formatting";
import { useSharedNow } from "../hooks/useSharedNow";

const TICK_MS = 1000;

/**
 * Displays live uptime since startedAt. Uses a shared clock so only this
 * component re-renders on time updates.
 */
export function UptimeDisplay({
  startedAt,
  tickMs = TICK_MS,
  className = "text-theme-muted tabular-nums",
}: {
  startedAt?: string;
  tickMs?: number;
  className?: string;
}) {
  const now = useSharedNow(tickMs, Boolean(startedAt));

  if (!startedAt) return <>—</>;
  return <span className={className}>{formatUptime(startedAt, now ?? undefined)}</span>;
}
