import type { Plan, PlanDependencyGraph } from "@opensprint/shared";

interface DependencyGraphProps {
  graph: PlanDependencyGraph | null;
  onPlanClick?: (plan: Plan) => void;
}

/** Simple SVG-based dependency graph. Nodes in topological layers, edges as lines. */
export function DependencyGraph({ graph, onPlanClick }: DependencyGraphProps) {
  if (!graph || graph.plans.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
        No plans to display
      </div>
    );
  }

  const { plans, edges } = graph;
  const planById = new Map(plans.map((p) => [p.metadata.planId, p]));

  // Topological sort: level 0 = no incoming edges, level 1 = depends on level 0, etc.
  const incoming = new Map<string, Set<string>>();
  const outgoing = new Map<string, Set<string>>();
  for (const p of plans) {
    incoming.set(p.metadata.planId, new Set());
    outgoing.set(p.metadata.planId, new Set());
  }
  for (const e of edges) {
    outgoing.get(e.from)?.add(e.to);
    incoming.get(e.to)?.add(e.from);
  }

  const levels: string[][] = [];
  const assigned = new Set<string>();
  let remaining = new Set(plans.map((p) => p.metadata.planId));

  while (remaining.size > 0) {
    const level: string[] = [];
    for (const id of remaining) {
      const deps = incoming.get(id)!;
      const allAssigned = [...deps].every((d) => assigned.has(d));
      if (allAssigned) level.push(id);
    }
    if (level.length === 0) {
      // Cycle or orphan - add all remaining
      level.push(...remaining);
    }
    for (const id of level) {
      assigned.add(id);
      remaining.delete(id);
    }
    levels.push(level);
  }

  // Flatten to get order, then assign grid positions
  const order = levels.flat();
  const COLS = 4;
  const NODE_W = 120;
  const NODE_H = 44;
  const PAD = 16;
  const positions = new Map<string, { x: number; y: number }>();
  order.forEach((id, i) => {
    const row = Math.floor(i / COLS);
    const col = i % COLS;
    positions.set(id, {
      x: PAD + col * (NODE_W + PAD) + NODE_W / 2,
      y: PAD + row * (NODE_H + PAD) + NODE_H / 2,
    });
  });

  const width = Math.max(400, COLS * (NODE_W + PAD) + PAD);
  const height = Math.max(120, Math.ceil(order.length / COLS) * (NODE_H + PAD) + PAD);

  return (
    <div className="overflow-x-auto">
      <svg width={width} height={height} className="min-w-full">
        <defs>
          <marker
            id="arrow"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="4"
            orient="auto"
          >
            <path d="M0,0 L8,4 L0,8 Z" fill="currentColor" className="text-gray-400" />
          </marker>
        </defs>
        {/* Edges */}
        {edges.map((e, i) => {
          const from = positions.get(e.from);
          const to = positions.get(e.to);
          if (!from || !to) return null;
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const len = Math.hypot(dx, dy) || 1;
          const offset = 20;
          const startX = from.x + (dx / len) * offset;
          const startY = from.y + (dy / len) * offset;
          const endX = to.x - (dx / len) * offset;
          const endY = to.y - (dy / len) * offset;
          const midX = (startX + endX) / 2;
          const midY = (startY + endY) / 2;
          const path = `M ${startX} ${startY} Q ${midX + dy * 0.2} ${midY - dx * 0.2} ${endX} ${endY}`;
          return (
            <path
              key={`${e.from}-${e.to}-${i}`}
              d={path}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-gray-300"
              markerEnd="url(#arrow)"
            />
          );
        })}
        {/* Nodes */}
        {order.map((id) => {
          const pos = positions.get(id)!;
          const plan = planById.get(id)!;
          const statusColors: Record<string, string> = {
            planning: "fill-amber-100 stroke-amber-300",
            shipped: "fill-blue-50 stroke-blue-300",
            complete: "fill-emerald-50 stroke-emerald-300",
          };
          const style = statusColors[plan.status] ?? "fill-gray-50 stroke-gray-200";
          return (
            <g
              key={id}
              transform={`translate(${pos.x - NODE_W / 2}, ${pos.y - NODE_H / 2})`}
              className="cursor-pointer"
              onClick={() => onPlanClick?.(plan)}
            >
              <rect
                width={NODE_W}
                height={NODE_H}
                rx="6"
                className={`stroke ${style} hover:stroke-gray-400 transition-colors`}
              />
              <text
                x={NODE_W / 2}
                y={NODE_H / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs font-medium fill-gray-700"
              >
                {plan.metadata.planId.replace(/-/g, " ").slice(0, 14)}
                {plan.metadata.planId.length > 14 ? "…" : ""}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
