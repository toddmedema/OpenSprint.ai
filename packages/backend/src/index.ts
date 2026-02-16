import path from "path";
import { config } from "dotenv";
import { createServer } from "http";
import { createApp } from "./app.js";

// Load .env from monorepo root (must run before any code that reads process.env)
config({ path: path.resolve(process.cwd(), ".env") });
config({ path: path.resolve(process.cwd(), "../.env") });
config({ path: path.resolve(process.cwd(), "../../.env") });
import { setupWebSocket, closeWebSocket } from "./websocket/index.js";
import { DEFAULT_API_PORT } from "@opensprint/shared";
import { ProjectService } from "./services/project.service.js";
import { BeadsService } from "./services/beads.service.js";
import { concurrentOrchestrator } from "./services/concurrent-orchestrator.js";

const port = parseInt(process.env.PORT || String(DEFAULT_API_PORT), 10);

const app = createApp();
const server = createServer(app);

// Attach WebSocket server
setupWebSocket(server);

async function logOrchestratorStatus(): Promise<void> {
  const projectService = new ProjectService();
  const beads = new BeadsService();

  try {
    const projects = await projectService.listProjects();
    if (projects.length === 0) {
      console.log("[orchestrator] No projects found");
      return;
    }

    console.log(`[orchestrator] ${projects.length} project(s) registered`);

    for (const project of projects) {
      try {
        // Auto-start orchestrator for each project (always-on)
        await concurrentOrchestrator.start(project.id);

        const allTasks = await beads.list(project.repoPath);
        const nonEpicTasks = allTasks.filter(
          (t) => (t.issue_type ?? (t as Record<string, unknown>).type) !== "epic",
        );
        const inProgress = nonEpicTasks.filter((t) => t.status === "in_progress");
        const open = nonEpicTasks.filter((t) => t.status === "open");

        const orchestratorStatus = await concurrentOrchestrator.getStatus(project.id);
        const activeAgents = concurrentOrchestrator.getAgentDetails(project.id);

        const parts: string[] = [
          `[orchestrator] "${project.name}"`,
          `${open.length} open task(s)`,
          `${inProgress.length} in-progress`,
          `${activeAgents.length} agent(s) running`,
          orchestratorStatus.running ? "loop ACTIVE" : "loop IDLE",
        ];
        console.log(parts.join(" | "));

        if (inProgress.length > 0) {
          for (const task of inProgress) {
            const assignee = task.assignee ?? "unassigned";
            console.log(`  → in_progress: ${task.id} "${task.title}" (${assignee})`);
          }
        }
      } catch (err) {
        console.warn(`[orchestrator] Could not read tasks for "${project.name}": ${(err as Error).message}`);
      }
    }
  } catch (err) {
    console.warn(`[orchestrator] Status check failed: ${(err as Error).message}`);
  }
}

server.listen(port, () => {
  console.log(`OpenSprint backend listening on http://localhost:${port}`);
  console.log(`WebSocket server ready on ws://localhost:${port}/ws`);
  logOrchestratorStatus();
});

// Graceful shutdown
const shutdown = () => {
  console.log("\nShutting down...");
  closeWebSocket();
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
  setTimeout(() => {
    console.error("Forced shutdown after timeout.");
    process.exit(1);
  }, 3000);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
