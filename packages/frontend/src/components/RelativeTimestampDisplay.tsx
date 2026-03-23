import { formatTimestamp } from "../lib/formatting";
import { useSharedNow } from "../hooks/useSharedNow";

const DEFAULT_TICK_MS = 30_000;

export function RelativeTimestampDisplay({
  timestamp,
  tickMs = DEFAULT_TICK_MS,
  className = "text-theme-muted tabular-nums",
}: {
  timestamp?: string;
  tickMs?: number;
  className?: string;
}) {
  const now = useSharedNow(tickMs, Boolean(timestamp));

  if (!timestamp) return <>—</>;

  return <span className={className}>{formatTimestamp(timestamp, now ?? undefined)}</span>;
}
