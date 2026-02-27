import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Task } from "@opensprint/shared";
import { api } from "../client";
import { queryKeys } from "../queryKeys";

/** Normalize tasks list to array (API may return { items } in some cases) */
function toTaskList(data: Task[] | { items: Task[] } | undefined): Task[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && "items" in data) return (data as { items: Task[] }).items ?? [];
  return [];
}

export function useTasks(projectId: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.tasks.list(projectId ?? ""),
    queryFn: async () => {
      const data = await api.tasks.list(projectId!);
      return toTaskList(data);
    },
    enabled: Boolean(projectId) && (options?.enabled !== false),
  });
}

export function useTaskDetail(
  projectId: string | undefined,
  taskId: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.tasks.detail(projectId ?? "", taskId ?? ""),
    queryFn: () => api.tasks.get(projectId!, taskId!),
    enabled:
      Boolean(projectId) &&
      Boolean(taskId) &&
      (options?.enabled !== false),
  });
}

export function useArchivedSessions(
  projectId: string | undefined,
  taskId: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.tasks.sessions(projectId ?? "", taskId ?? ""),
    queryFn: async () => (await api.tasks.sessions(projectId!, taskId!)) ?? [],
    enabled:
      Boolean(projectId) &&
      Boolean(taskId) &&
      (options?.enabled !== false),
  });
}

export function useExecuteStatus(projectId: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.execute.status(projectId ?? ""),
    queryFn: () => api.execute.status(projectId!),
    enabled: Boolean(projectId) && (options?.enabled !== false),
  });
}

export function useLiveOutputBackfill(
  projectId: string | undefined,
  taskId: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.execute.liveOutput(projectId ?? "", taskId ?? ""),
    queryFn: async () => {
      const res = await api.execute.liveOutput(projectId!, taskId!);
      return { taskId: taskId!, output: res.output };
    },
    enabled:
      Boolean(projectId) &&
      Boolean(taskId) &&
      (options?.enabled !== false),
  });
}

export function useMarkTaskDone(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => api.tasks.markDone(projectId, taskId),
    onSuccess: async () => {
      void qc.invalidateQueries({ queryKey: queryKeys.tasks.list(projectId) });
      void qc.invalidateQueries({ queryKey: queryKeys.plans.list(projectId) });
    },
  });
}

export function useUpdateTaskPriority(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      priority,
    }: {
      taskId: string;
      priority: number;
    }) => api.tasks.updatePriority(projectId, taskId, priority),
    onSuccess: (_, { taskId }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.tasks.list(projectId) });
      void qc.invalidateQueries({
        queryKey: queryKeys.tasks.detail(projectId, taskId),
      });
    },
  });
}

export function useUnblockTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      resetAttempts,
    }: {
      taskId: string;
      resetAttempts?: boolean;
    }) => api.tasks.unblock(projectId, taskId, { resetAttempts }),
    onSuccess: async () => {
      void qc.invalidateQueries({ queryKey: queryKeys.tasks.list(projectId) });
      void qc.invalidateQueries({ queryKey: queryKeys.plans.list(projectId) });
    },
  });
}

export function useActiveAgents(projectId: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["agents", "active", projectId ?? ""],
    queryFn: async () => {
      const agents = await api.agents.active(projectId!);
      const taskIdToStartedAt: Record<string, string> = {};
      for (const a of agents) {
        if (a.phase === "coding" || a.phase === "review") {
          taskIdToStartedAt[a.id] = a.startedAt;
        }
      }
      return { agents, taskIdToStartedAt };
    },
    enabled: Boolean(projectId) && (options?.enabled !== false),
  });
}
