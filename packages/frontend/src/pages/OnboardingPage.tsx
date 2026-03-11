import { useSearchParams } from "react-router-dom";
import { Layout } from "../components/layout/Layout";

/**
 * Initial Setup (onboarding) page. Full-page layout with Prerequisites and Agent setup.
 * Optional query param: intended (e.g. /onboarding?intended=/projects/create-new).
 */
export function OnboardingPage() {
  const [searchParams] = useSearchParams();
  const intended = searchParams.get("intended") ?? undefined;

  return (
    <Layout>
      <div
        className="flex-1 min-h-0 flex flex-col overflow-hidden bg-theme-surface"
        data-testid="onboarding-page"
      >
        <div className="flex-1 min-h-0 overflow-y-auto max-w-[1440px] mx-auto w-full px-4 sm:px-6 pt-6 pb-8">
          <h1 className="text-2xl font-semibold text-theme-fg mb-6" data-testid="onboarding-title">
            Initial Setup
          </h1>

          <section
            className="mb-8"
            aria-labelledby="prerequisites-heading"
            data-testid="onboarding-prerequisites"
          >
            <h2 id="prerequisites-heading" className="text-lg font-medium text-theme-fg mb-3">
              Prerequisites
            </h2>
            <p className="text-theme-muted text-sm">Placeholder: Git and Node.js status will appear here.</p>
          </section>

          <section
            className="mb-8"
            aria-labelledby="agent-setup-heading"
            data-testid="onboarding-agent-setup"
          >
            <h2 id="agent-setup-heading" className="text-lg font-medium text-theme-fg mb-3">
              Agent setup
            </h2>
            <p className="text-theme-muted text-sm">Placeholder: Provider and API key configuration will appear here.</p>
          </section>

          {intended !== undefined && (
            <p className="text-theme-muted text-xs" data-testid="onboarding-intended">
              Intended destination: {intended}
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
}
