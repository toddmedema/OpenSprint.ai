/** Message patterns for connection/DB error toasts that should auto-dismiss when connection is restored. */
export const CONNECTION_TOAST_MESSAGE_PATTERN =
  /failed to connect|reconnecting to postgres|connecting to postgres|connecting to database|postgres.*unavailable|unable to connect.*postgres|could not connect|server.*unreachable|open sprint server/i;
