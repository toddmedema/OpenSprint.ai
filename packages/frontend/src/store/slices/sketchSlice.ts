import { createPrdChatSlice } from "./prdChatSliceFactory";
import type { PrdChatState } from "./prdChatSliceFactory";

const { slice, thunks } = createPrdChatSlice("sketch");

export type SketchState = PrdChatState;

export const fetchSketchChat = thunks.fetchChat;
export const fetchPrd = thunks.fetchPrd;
export const fetchPrdHistory = thunks.fetchPrdHistory;
export const sendSketchMessage = thunks.sendMessage;
export const savePrdSection = thunks.savePrdSection;
export const uploadPrdFile = thunks.uploadPrdFile;

const { addUserMessage, setError, setPrdContent, setPrdHistory, setMessages, reset } =
  slice.actions;

export { addUserMessage, setPrdContent, setPrdHistory, setMessages };
export const setSketchError = setError;
export const resetSketch = reset;

export default slice.reducer;
