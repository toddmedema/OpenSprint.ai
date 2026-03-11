import { Link } from "react-router-dom";
import { CriticalStateView } from "./CriticalStateView";

/** Critical-state view: one h1, one primary action, concise aria-describedby for screen readers. */
export function ProjectNotFoundState() {
  const summary = "Project not found or failed to load. Return to home to continue.";
  return (
    <CriticalStateView
      data-testid="project-not-found-state"
      heading="Project not found"
      summary={summary}
      role="region"
      primaryAction={
        <Link to="/" className="btn-primary inline-flex">
          Return to home
        </Link>
      }
    />
  );
}
