/** Plan complexity estimate */
export type PlanComplexity = 'low' | 'medium' | 'high' | 'very_high';

/** Plan status derived from beads epic state */
export type PlanStatus = 'planning' | 'shipped' | 'complete';

/** Metadata for a Plan (stored alongside markdown at .opensprint/plans/<plan-id>.md) */
export interface PlanMetadata {
  planId: string;
  beadEpicId: string;
  gateTaskId: string;
  shippedAt: string | null;
  complexity: PlanComplexity;
}

/** Plan with its content and metadata */
export interface Plan {
  metadata: PlanMetadata;
  content: string;
  status: PlanStatus;
  taskCount: number;
  completedTaskCount: number;
  dependencyCount: number;
}

/** Dependency edge between Plans for the dependency graph */
export interface PlanDependencyEdge {
  from: string;
  to: string;
  type: 'blocks' | 'related';
}

/** Dependency graph data */
export interface PlanDependencyGraph {
  plans: Plan[];
  edges: PlanDependencyEdge[];
}
