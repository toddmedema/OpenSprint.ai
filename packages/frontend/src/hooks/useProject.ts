import { useState, useEffect } from 'react';
import type { Project } from '@opensprint/shared';
import { api } from '../api/client';

export function useProject(projectId: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const data = await api.projects.get(projectId);
        if (!cancelled) {
          setProject(data as Project);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load project');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return { project, loading, error };
}
