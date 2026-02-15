import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { api } from '../api/client';

interface ProjectCard {
  id: string;
  name: string;
  currentPhase: string;
  updatedAt: string;
}

export function Home() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.projects
      .list()
      .then((data) => setProjects(data as ProjectCard[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="mt-1 text-gray-500">
              Manage your AI-powered development projects
            </p>
          </div>
          <button
            onClick={() => navigate('/projects/new')}
            className="btn-primary"
          >
            Create New Project
          </button>
        </div>

        {/* Project Grid */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No projects yet</h3>
            <p className="text-gray-500 mb-6">Get started by creating your first project</p>
            <button
              onClick={() => navigate('/projects/new')}
              className="btn-primary"
            >
              Create New Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="card p-5 hover:shadow-md transition-shadow group"
              >
                <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">
                  {project.name}
                </h3>
                <div className="mt-3 flex items-center justify-between">
                  <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 capitalize">
                    {project.currentPhase}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
