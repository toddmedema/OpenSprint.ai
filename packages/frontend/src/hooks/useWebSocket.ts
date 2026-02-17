/**
 * @deprecated Replaced by WS middleware (websocketMiddleware) + websocketSlice.
 * Use wsConnect, wsDisconnect, wsSend from store/middleware/websocketMiddleware instead.
 */
export function useWebSocket() {
  throw new Error(
    "useWebSocket is deprecated. Use wsConnect, wsDisconnect, wsSend from store/middleware/websocketMiddleware instead.",
  );
}
