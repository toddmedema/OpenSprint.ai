import { createSlice } from "@reduxjs/toolkit";

export interface ConnectionState {
  /** True when fetch/WebSocket failed due to network/server unreachable. */
  connectionError: boolean;
}

const initialState: ConnectionState = {
  connectionError: false,
};

export const connectionSlice = createSlice({
  name: "connection",
  initialState,
  reducers: {
    setConnectionError(state, action: { payload: boolean }) {
      state.connectionError = action.payload;
    },
  },
});

export const { setConnectionError } = connectionSlice.actions;
export default connectionSlice.reducer;
