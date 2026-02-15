import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import type { AgentType, DeploymentMode, HilNotificationMode } from '@opensprint/shared';
import { DEFAULT_HIL_CONFIG } from '@opensprint/shared';
import { api } from '../api/client';

type Step = 'basics' | 'agents' | 'deployment' | 'hil' | 'confirm';

const STEPS: { key: Step; label: string }[] = [
  { key: 'basics', label: 'Project Info' },
  { key: 'agents', label: 'Agent Config' },
  { key: 'deployment', label: 'Deployment' },
  { key: 'hil', label: 'Autonomy' },
  { key: 'confirm', label: 'Confirm' },
];

export function ProjectSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('basics');
  const [creating, setCreating] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [repoPath, setRepoPath] = useState('');
  const [planningAgentType, setPlanningAgentType] = useState<AgentType>('claude');
  const [planningModel, setPlanningModel] = useState('');
  const [codingAgentType, setCodingAgentType] = useState<AgentType>('claude');
  const [codingModel, setCodingModel] = useState('');
  const [deploymentMode, setDeploymentMode] = useState<DeploymentMode>('custom');
  const [hilConfig, setHilConfig] = useState(DEFAULT_HIL_CONFIG);

  const currentStepIndex = STEPS.findIndex((s) => s.key === step);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const project = await api.projects.create({
        name,
        description,
        repoPath,
        planningAgent: { type: planningAgentType, model: planningModel || null, cliCommand: null },
        codingAgent: { type: codingAgentType, model: codingModel || null, cliCommand: null },
        deployment: { mode: deploymentMode },
        hilConfig,
      });
      navigate(`/projects/${(project as { id: string }).id}`);
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Create New Project</h1>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  i <= currentStepIndex
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {i + 1}
              </div>
              <span className={`text-sm ${i <= currentStepIndex ? 'text-gray-900' : 'text-gray-400'}`}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 ${i < currentStepIndex ? 'bg-brand-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="card p-6">
          {step === 'basics' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                <input
                  type="text"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Awesome App"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="input min-h-[80px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A brief description of what you're building"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Repository Path</label>
                <input
                  type="text"
                  className="input font-mono text-sm"
                  value={repoPath}
                  onChange={(e) => setRepoPath(e.target.value)}
                  placeholder="/Users/you/projects/my-app"
                />
                <p className="mt-1 text-xs text-gray-400">Absolute path where the project repo will be created</p>
              </div>
            </div>
          )}

          {step === 'agents' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Planning Agent</h3>
                <p className="text-xs text-gray-500 mb-3">Used for Design conversations and Plan decomposition</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                    <select
                      className="input"
                      value={planningAgentType}
                      onChange={(e) => setPlanningAgentType(e.target.value as AgentType)}
                    >
                      <option value="claude">Claude</option>
                      <option value="cursor">Cursor</option>
                      <option value="custom">Custom CLI</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                    <input
                      type="text"
                      className="input"
                      value={planningModel}
                      onChange={(e) => setPlanningModel(e.target.value)}
                      placeholder="e.g., opus, sonnet"
                    />
                  </div>
                </div>
              </div>
              <hr />
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Coding Agent</h3>
                <p className="text-xs text-gray-500 mb-3">Used for Build phase implementation and review</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                    <select
                      className="input"
                      value={codingAgentType}
                      onChange={(e) => setCodingAgentType(e.target.value as AgentType)}
                    >
                      <option value="claude">Claude</option>
                      <option value="cursor">Cursor</option>
                      <option value="custom">Custom CLI</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                    <input
                      type="text"
                      className="input"
                      value={codingModel}
                      onChange={(e) => setCodingModel(e.target.value)}
                      placeholder="e.g., opus, sonnet"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'deployment' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Deployment Mode</label>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-brand-300 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="deployment"
                      value="expo"
                      checked={deploymentMode === 'expo'}
                      onChange={() => setDeploymentMode('expo')}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Expo.dev</p>
                      <p className="text-xs text-gray-500">Automatic deployment for React Native and web projects</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-brand-300 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="deployment"
                      value="custom"
                      checked={deploymentMode === 'custom'}
                      onChange={() => setDeploymentMode('custom')}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Custom Pipeline</p>
                      <p className="text-xs text-gray-500">Connect your own CI/CD system</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {step === 'hil' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 mb-4">
                Configure when OpenSprint should pause for your input vs. proceed autonomously.
              </p>
              {(
                [
                  { key: 'scopeChanges', label: 'Scope Changes', desc: 'Adds, removes, or alters features' },
                  { key: 'architectureDecisions', label: 'Architecture Decisions', desc: 'Tech stack, integrations, schema changes' },
                  { key: 'dependencyModifications', label: 'Dependency Modifications', desc: 'Task reordering and re-prioritization' },
                  { key: 'testFailuresAndRetries', label: 'Test Failures & Retries', desc: 'How to handle failing tests' },
                ] as const
              ).map((cat) => (
                <div key={cat.key} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{cat.label}</p>
                    <p className="text-xs text-gray-500">{cat.desc}</p>
                  </div>
                  <select
                    className="input w-48"
                    value={hilConfig[cat.key]}
                    onChange={(e) =>
                      setHilConfig({ ...hilConfig, [cat.key]: e.target.value as HilNotificationMode })
                    }
                  >
                    <option value="requires_approval">Requires Approval</option>
                    <option value="notify_and_proceed">Notify & Proceed</option>
                    <option value="automated">Automated</option>
                  </select>
                </div>
              ))}
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Review your project setup</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Name</dt>
                  <dd className="font-medium">{name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Repository</dt>
                  <dd className="font-mono text-xs">{repoPath}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Planning Agent</dt>
                  <dd className="font-medium capitalize">{planningAgentType} {planningModel && `(${planningModel})`}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Coding Agent</dt>
                  <dd className="font-medium capitalize">{codingAgentType} {codingModel && `(${codingModel})`}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Deployment</dt>
                  <dd className="font-medium capitalize">{deploymentMode}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={() => setStep(STEPS[currentStepIndex - 1]?.key ?? 'basics')}
            disabled={currentStepIndex === 0}
            className="btn-secondary disabled:opacity-50"
          >
            Back
          </button>
          {step === 'confirm' ? (
            <button onClick={handleCreate} disabled={creating} className="btn-primary">
              {creating ? 'Creating...' : 'Create Project'}
            </button>
          ) : (
            <button
              onClick={() => setStep(STEPS[currentStepIndex + 1]?.key ?? 'confirm')}
              className="btn-primary"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
}
