import { useState, useEffect } from "react";
import { formatUptime } from "../lib/formatting";

const TICK_MS = 1000;

/**
 * Displays live uptime since startedAt. Uses internal 1s tick so only this
 * component re-renders on time updates — parent/dropdown stays stable.
 */
export function UptimeDisplay({ startedAt }: { startedAt?: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  if (!startedAt) return <>—</>;
  return <span className="text-theme-muted tabular-nums">{formatUptime(startedAt, now)}</span>;
}
