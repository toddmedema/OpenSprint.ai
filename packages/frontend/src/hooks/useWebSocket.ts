import { useEffect, useRef, useCallback, useState } from 'react';
import type { ServerEvent, ClientEvent } from '@opensprint/shared';

interface UseWebSocketOptions {
  projectId: string;
  onEvent?: (event: ServerEvent) => void;
}

export function useWebSocket({ projectId, onEvent }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}/ws/projects/${projectId}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      console.log('[WS] Connected to project', projectId);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ServerEvent;
        onEvent?.(data);
      } catch (err) {
        console.error('[WS] Failed to parse message:', err);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      console.log('[WS] Disconnected');
    };

    ws.onerror = (err) => {
      console.error('[WS] Error:', err);
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [projectId, onEvent]);

  const send = useCallback((event: ClientEvent) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(event));
    }
  }, []);

  const subscribeToAgent = useCallback(
    (taskId: string) => {
      send({ type: 'agent.subscribe', taskId });
    },
    [send],
  );

  const unsubscribeFromAgent = useCallback(
    (taskId: string) => {
      send({ type: 'agent.unsubscribe', taskId });
    },
    [send],
  );

  return { connected, send, subscribeToAgent, unsubscribeFromAgent };
}
