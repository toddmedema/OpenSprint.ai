/**
 * @deprecated Use evalSlice instead. This file re-exports from evalSlice for backward compatibility.
 */
export {
  type EvalState,
  fetchFeedback,
  submitFeedback,
  recategorizeFeedback,
  setFeedback,
  setEvalError,
  resetEval,
} from "./evalSlice";
export { default } from "./evalSlice";
