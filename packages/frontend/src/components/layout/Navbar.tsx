import { Link } from 'react-router-dom';
import type { Project, ProjectPhase } from '@opensprint/shared';

interface NavbarProps {
  project?: Project | null;
  currentPhase?: ProjectPhase;
  onPhaseChange?: (phase: ProjectPhase) => void;
}

const phases: { key: ProjectPhase; label: string }[] = [
  { key: 'design', label: 'Design' },
  { key: 'plan', label: 'Plan' },
  { key: 'build', label: 'Build' },
  { key: 'validate', label: 'Validate' },
];

export function Navbar({ project, currentPhase, onPhaseChange }: NavbarProps) {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left: Logo + Project Selector */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">OS</span>
            </div>
            <span className="font-semibold text-lg text-gray-900">OpenSprint</span>
          </Link>

          {project && (
            <>
              <span className="text-gray-300">/</span>
              <button className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                {project.name}
              </button>
            </>
          )}
        </div>

        {/* Center: Phase Tabs */}
        {project && currentPhase && onPhaseChange && (
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {phases.map((phase) => (
              <button
                key={phase.key}
                onClick={() => onPhaseChange(phase.key)}
                className={`phase-tab ${
                  currentPhase === phase.key
                    ? 'phase-tab-active'
                    : 'phase-tab-inactive'
                }`}
              >
                {phase.label}
              </button>
            ))}
          </div>
        )}

        {/* Right: Settings / Status */}
        <div className="flex items-center gap-3">
          {project && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Online</span>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
