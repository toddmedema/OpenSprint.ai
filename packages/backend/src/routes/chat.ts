import { Router, Request } from "express";
import { wrapAsync } from "../middleware/wrap-async.js";
import { validateParams, validateBody, validateQuery } from "../middleware/validate.js";
import {
  projectIdParamSchema,
  chatRequestBodySchema,
  chatHistoryQuerySchema,
} from "../schemas/request-common.js";
import type { ApiResponse, ChatResponse, Conversation } from "@opensprint/shared";
import { createLogger } from "../utils/logger.js";
import type { ChatService } from "../services/chat.service.js";

const log = createLogger("chat-route");

type ProjectParams = { projectId: string };
interface ChatRouterDeps {
  chatService: Pick<ChatService, "sendMessage" | "getHistory">;
}

export function createChatRouter({ chatService }: ChatRouterDeps): Router {
  const chatRouter = Router({ mergeParams: true });

  // POST /projects/:projectId/chat — Send a message to the planning agent.
  // projectId from params is the single source of truth; PRD updates are applied to that project's repo only.
  chatRouter.post(
    "/",
    validateParams(projectIdParamSchema),
    validateBody(chatRequestBodySchema),
    wrapAsync(async (req: Request<ProjectParams>, res) => {
      const body = req.body as { message: string; context?: string; [k: string]: unknown };
      const context = body.context ?? "sketch";
      log.info("POST received", {
        projectId: req.params.projectId,
        context,
        messageLen: body.message?.length ?? 0,
      });
      const response = await chatService.sendMessage(req.params.projectId, { ...body, context });
      log.info("POST completed", { projectId: req.params.projectId });
      const result: ApiResponse<ChatResponse> = { data: response };
      res.json(result);
    })
  );

  // GET /projects/:projectId/chat/history — Get conversation history
  chatRouter.get(
    "/history",
    validateParams(projectIdParamSchema),
    validateQuery(chatHistoryQuerySchema),
    wrapAsync(async (req: Request<ProjectParams>, res) => {
      const context = (req.query as { context?: string }).context ?? "sketch";
      const conversation = await chatService.getHistory(req.params.projectId, context);
      const result: ApiResponse<Conversation> = { data: conversation };
      res.json(result);
    })
  );

  return chatRouter;
}
