/**
 * @deprecated Use verifySlice instead. This file re-exports from verifySlice for backward compatibility.
 */
export {
  type VerifyState as ValidateState,
  fetchFeedback,
  submitFeedback,
  recategorizeFeedback,
  setFeedback,
  setVerifyError as setValidateError,
  resetVerify as resetValidate,
} from "./verifySlice";
export { default } from "./verifySlice";
