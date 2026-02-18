import { createListenerMiddleware, isRejected } from "@reduxjs/toolkit";
import { addNotification } from "../slices/notificationSlice";

/** Listens for rejected thunks and adds error notifications. */
export const notificationListener = createListenerMiddleware();

notificationListener.startListening({
  predicate: isRejected,
  effect: (action, listenerApi) => {
    const msg =
      (action.error as { message?: string } | undefined)?.message ??
      (typeof action.payload === "string" ? action.payload : null) ??
      "An error occurred";
    listenerApi.dispatch(addNotification({ message: msg, severity: "error" }));
  },
});
