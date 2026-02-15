import {
  createContext,
  useContext,
  useRef,
  useCallback,
  useState,
  type ReactNode,
} from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import type { ServerEvent, HilRequestEvent } from "@opensprint/shared";

interface ProjectWebSocketContextValue {
  connected: boolean;
  send: (event: import("@opensprint/shared").ClientEvent) => void;
  subscribeToAgent: (taskId: string) => void;
  unsubscribeFromAgent: (taskId: string) => void;
  registerEventHandler: (handler: (event: ServerEvent) => void) => () => void;
  hilRequest: HilRequestEvent | null;
  clearHilRequest: () => void;
  respondToHil: (requestId: string, approved: boolean, notes?: string) => void;
}

const ProjectWebSocketContext = createContext<ProjectWebSocketContextValue | null>(null);

function useProjectWebSocket() {
  const ctx = useContext(ProjectWebSocketContext);
  if (!ctx) throw new Error("ProjectWebSocketContext must be used within ProjectWebSocketProvider");
  return ctx;
}

interface ProjectWebSocketProviderProps {
  projectId: string;
  children: ReactNode;
}

export function ProjectWebSocketProvider({ projectId, children }: ProjectWebSocketProviderProps) {
  const [hilRequest, setHilRequest] = useState<HilRequestEvent | null>(null);
  const handlersRef = useRef<Set<(e: ServerEvent) => void>>(new Set());

  const onEvent = useCallback((event: ServerEvent) => {
    if (event.type === "hil.request") {
      setHilRequest(event);
    }
    handlersRef.current.forEach((h) => h(event));
  }, []);

  const { connected, send, subscribeToAgent, unsubscribeFromAgent } = useWebSocket({
    projectId,
    onEvent,
  });

  const registerEventHandler = useCallback((handler: (event: ServerEvent) => void) => {
    handlersRef.current.add(handler);
    return () => {
      handlersRef.current.delete(handler);
    };
  }, []);

  const clearHilRequest = useCallback(() => setHilRequest(null), []);

  const respondToHil = useCallback(
    (requestId: string, approved: boolean, notes?: string) => {
      send({ type: "hil.respond", requestId, approved, notes });
      setHilRequest(null);
    },
    [send],
  );

  const value: ProjectWebSocketContextValue = {
    connected,
    send,
    subscribeToAgent,
    unsubscribeFromAgent,
    registerEventHandler,
    hilRequest,
    clearHilRequest,
    respondToHil,
  };

  return (
    <ProjectWebSocketContext.Provider value={value}>
      {children}
    </ProjectWebSocketContext.Provider>
  );
}

export { useProjectWebSocket };
