import { Link } from "react-router-dom";
import { CriticalStateView } from "./CriticalStateView";

/** Critical-state view: one h1, one primary action, concise aria-describedby for screen readers. */
export function DatabaseUnavailableState({
  message,
  settingsHref,
}: {
  message: string;
  settingsHref: string;
}) {
  const summary = `${message} Project phase content is unavailable until the database reconnects.`;
  return (
    <CriticalStateView
      data-testid="database-unavailable-state"
      heading="Database unavailable"
      summary={summary}
      role="region"
      primaryAction={
        <Link to={settingsHref} className="btn-primary inline-flex">
          Open Settings
        </Link>
      }
    />
  );
}
