import { useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ProjectPhase } from '@opensprint/shared';
import { Layout } from '../components/layout/Layout';
import { useProject } from '../hooks/useProject';
import { DesignPhase } from './phases/DesignPhase';
import { PlanPhase } from './phases/PlanPhase';
import { BuildPhase } from './phases/BuildPhase';
import { ValidatePhase } from './phases/ValidatePhase';

export function ProjectView() {
  const { projectId } = useParams<{ projectId: string }>();
  const { project, loading, error } = useProject(projectId!);
  const [currentPhase, setCurrentPhase] = useState<ProjectPhase>('design');

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full text-gray-400">
          Loading project...
        </div>
      </Layout>
    );
  }

  if (error || !project) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full text-red-500">
          {error ?? 'Project not found'}
        </div>
      </Layout>
    );
  }

  const phaseComponents: Record<ProjectPhase, React.ReactNode> = {
    design: <DesignPhase projectId={projectId!} />,
    plan: <PlanPhase projectId={projectId!} />,
    build: <BuildPhase projectId={projectId!} />,
    validate: <ValidatePhase projectId={projectId!} />,
  };

  return (
    <Layout
      project={project}
      currentPhase={currentPhase}
      onPhaseChange={setCurrentPhase}
    >
      {phaseComponents[currentPhase]}
    </Layout>
  );
}
