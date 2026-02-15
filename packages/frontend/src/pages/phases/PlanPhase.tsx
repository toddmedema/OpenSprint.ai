import { useState, useEffect, useCallback } from "react";
import { api } from "../../api/client";
import type { Plan, PlanDependencyGraph } from "@opensprint/shared";
import { AddPlanModal } from "../../components/AddPlanModal";
import { DependencyGraph } from "../../components/DependencyGraph";

interface PlanPhaseProps {
  projectId: string;
}

export function PlanPhase({ projectId }: PlanPhaseProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [dependencyGraph, setDependencyGraph] = useState<PlanDependencyGraph | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [decomposing, setDecomposing] = useState(false);
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPlans = useCallback(async () => {
    const [listData, depsData] = await Promise.all([
      api.plans.list(projectId),
      api.plans.dependencies(projectId).catch(() => null),
    ]);
    setPlans(listData as Plan[]);
    setDependencyGraph(depsData as PlanDependencyGraph | null);
  }, [projectId]);

  const handleDecompose = async () => {
    setError(null);
    setDecomposing(true);
    try {
      await api.plans.decompose(projectId);
      await refreshPlans();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "AI decomposition failed";
      setError(msg);
    } finally {
      setDecomposing(false);
    }
  };

  useEffect(() => {
    refreshPlans().catch(console.error).finally(() => setLoading(false));
  }, [refreshPlans]);

  const handleShip = async (planId: string) => {
    setError(null);
    try {
      await api.plans.ship(projectId, planId);
      await refreshPlans();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to ship plan";
      setError(msg);
    }
  };

  const handleReship = async (planId: string) => {
    setError(null);
    try {
      await api.plans.reship(projectId, planId);
      await refreshPlans();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to re-ship plan";
      setError(msg);
    }
  };

  const handlePlanCreated = (plan: Plan) => {
    setPlans((prev) => [...prev, plan]);
  };

  const statusColors: Record<string, string> = {
    planning: "bg-yellow-50 text-yellow-700",
    shipped: "bg-blue-50 text-blue-700",
    complete: "bg-green-50 text-green-700",
  };

  return (
    <div className="flex h-full">
      {error && (
        <div className="mx-4 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex justify-between items-center">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-red-500 hover:text-red-700 underline">
            Dismiss
          </button>
        </div>
      )}
      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Dependency Graph */}
        <div className="card p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Dependency Graph</h3>
          <DependencyGraph
            graph={dependencyGraph}
            onPlanClick={setSelectedPlan}
          />
        </div>

        {/* Plan Cards */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Feature Plans</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDecompose}
              disabled={decomposing}
              className="btn-primary text-sm"
            >
              {decomposing ? "Decomposing…" : "Decompose from PRD"}
            </button>
            <button
              type="button"
              onClick={() => setShowAddPlanModal(true)}
              className="btn-primary text-sm"
            >
              Add Plan
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-400">Loading plans...</div>
        ) : plans.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 mb-4">
              No plans yet. Use AI to decompose the PRD into feature plans and tasks, or add a plan manually.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={handleDecompose}
                disabled={decomposing}
                className="btn-primary"
              >
                {decomposing ? "Decomposing…" : "Decompose from PRD"}
              </button>
              <button
                type="button"
                onClick={() => setShowAddPlanModal(true)}
                className="btn-primary"
              >
                Add Plan
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.metadata.planId}
                className="card p-5 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedPlan(plan)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{plan.metadata.planId.replace(/-/g, " ")}</h3>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                      statusColors[plan.status] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {plan.status}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <span>{plan.taskCount} tasks</span>
                  <span>{plan.completedTaskCount} completed</span>
                  <span className="capitalize">{plan.metadata.complexity} complexity</span>
                </div>

                {plan.status === "planning" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShip(plan.metadata.planId);
                    }}
                    className="btn-primary text-xs w-full"
                  >
                    Ship it!
                  </button>
                )}
                {plan.status === "complete" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReship(plan.metadata.planId);
                    }}
                    className="btn-secondary text-xs w-full"
                  >
                    Re-ship
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddPlanModal && (
        <AddPlanModal
          projectId={projectId}
          onClose={() => setShowAddPlanModal(false)}
          onCreated={handlePlanCreated}
        />
      )}

      {/* Sidebar: Plan Detail / Chat */}
      {selectedPlan && (
        <div className="w-[400px] border-l border-gray-200 overflow-y-auto p-6 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Plan Details</h3>
            <button onClick={() => setSelectedPlan(null)} className="text-gray-400 hover:text-gray-600">
              Close
            </button>
          </div>
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-xs bg-white p-4 rounded-lg border">{selectedPlan.content}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
