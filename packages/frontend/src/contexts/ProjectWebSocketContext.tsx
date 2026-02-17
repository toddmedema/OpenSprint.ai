/**
 * @deprecated Replaced by WS middleware + websocketSlice.
 * Use useAppSelector/useAppDispatch with websocketSlice and wsSend instead.
 */
export function ProjectWebSocketProvider() {
  throw new Error(
    "ProjectWebSocketProvider is deprecated. Use Redux (websocketSlice + wsConnect/wsSend) instead.",
  );
}

export function useProjectWebSocket() {
  throw new Error(
    "useProjectWebSocket is deprecated. Use useAppSelector/useAppDispatch with websocketSlice and wsSend instead.",
  );
}
