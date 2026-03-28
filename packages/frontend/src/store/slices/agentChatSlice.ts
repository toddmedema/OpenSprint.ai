import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { api } from "../../api/client";

export interface AgentChatMessageEntry {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  delivered?: boolean;
}

export interface AgentChatState {
  messagesByTaskId: Record<string, AgentChatMessageEntry[]>;
  sendingByTaskId: Record<string, boolean>;
  supportByTaskId: Record<string, { supported: boolean; reason?: string }>;
}

export const initialAgentChatState: AgentChatState = {
  messagesByTaskId: {},
  sendingByTaskId: {},
  supportByTaskId: {},
};

export const fetchAgentChatHistory = createAsyncThunk(
  "agentChat/fetchHistory",
  async ({ projectId, taskId }: { projectId: string; taskId: string }) => {
    const response = await api.tasks.chatHistory(projectId, taskId);
    return { taskId, messages: response.messages, chatSupported: response.chatSupported };
  }
);

export const fetchAgentChatSupport = createAsyncThunk(
  "agentChat/fetchSupport",
  async ({ projectId, taskId }: { projectId: string; taskId: string }) => {
    const response = await api.tasks.chatSupport(projectId, taskId);
    return { taskId, supported: response.supported, reason: response.reason };
  }
);

const agentChatSlice = createSlice({
  name: "agentChat",
  initialState: initialAgentChatState,
  reducers: {
    addOptimisticUserMessage(
      state,
      action: PayloadAction<{ taskId: string; tempId: string; content: string }>
    ) {
      const { taskId, tempId, content } = action.payload;
      if (!state.messagesByTaskId[taskId]) state.messagesByTaskId[taskId] = [];
      state.messagesByTaskId[taskId].push({
        id: tempId,
        role: "user",
        content,
        timestamp: new Date().toISOString(),
        delivered: false,
      });
      state.sendingByTaskId[taskId] = true;
    },

    chatMessageReceived(
      state,
      action: PayloadAction<{ taskId: string; messageId: string; timestamp: string }>
    ) {
      const { taskId, messageId, timestamp } = action.payload;
      const msgs = state.messagesByTaskId[taskId];
      if (!msgs) return;
      if (msgs.some((m) => m.id === messageId)) return;
      const optimistic = msgs.find((m) => m.role === "user" && !m.delivered);
      if (optimistic) {
        optimistic.id = messageId;
        optimistic.timestamp = timestamp;
        optimistic.delivered = true;
      }
    },

    chatResponseReceived(
      state,
      action: PayloadAction<{ taskId: string; messageId: string; content: string }>
    ) {
      const { taskId, messageId, content } = action.payload;
      if (!state.messagesByTaskId[taskId]) state.messagesByTaskId[taskId] = [];
      const responseId = `resp-${messageId}`;
      if (state.messagesByTaskId[taskId].some((m) => m.id === responseId)) return;
      state.messagesByTaskId[taskId].push({
        id: responseId,
        role: "assistant",
        content,
        timestamp: new Date().toISOString(),
        delivered: true,
      });
      state.sendingByTaskId[taskId] = false;
    },

    chatUnsupported(state, action: PayloadAction<{ taskId: string; reason: string }>) {
      const { taskId, reason } = action.payload;
      state.supportByTaskId[taskId] = { supported: false, reason };
      state.sendingByTaskId[taskId] = false;
    },

    setChatSupport(
      state,
      action: PayloadAction<{ taskId: string; supported: boolean; reason?: string }>
    ) {
      const { taskId, supported, reason } = action.payload;
      state.supportByTaskId[taskId] = { supported, reason };
    },

    resetChatSending(state, action: PayloadAction<{ taskId: string }>) {
      state.sendingByTaskId[action.payload.taskId] = false;
    },

    clearChatForTask(state, action: PayloadAction<{ taskId: string }>) {
      delete state.messagesByTaskId[action.payload.taskId];
      delete state.sendingByTaskId[action.payload.taskId];
      delete state.supportByTaskId[action.payload.taskId];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAgentChatHistory.fulfilled, (state, action) => {
        const { taskId, messages, chatSupported } = action.payload;
        const existing = state.messagesByTaskId[taskId] ?? [];
        const serverIds = new Set(messages.map((m) => m.id));
        const localOnly = existing.filter(
          (m) => m.role === "user" && !m.delivered && !serverIds.has(m.id)
        );
        state.messagesByTaskId[taskId] = [
          ...messages.map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
            timestamp: m.timestamp,
            delivered: true,
          })),
          ...localOnly,
        ];
        if (chatSupported !== undefined) {
          const prev = state.supportByTaskId[taskId];
          if (!prev || prev.supported !== chatSupported) {
            state.supportByTaskId[taskId] = { supported: chatSupported };
          }
        }
      })
      .addCase(fetchAgentChatSupport.fulfilled, (state, action) => {
        const { taskId, supported, reason } = action.payload;
        state.supportByTaskId[taskId] = {
          supported,
          reason: reason ?? undefined,
        };
      });
  },
});

export const {
  addOptimisticUserMessage,
  chatMessageReceived,
  chatResponseReceived,
  chatUnsupported,
  setChatSupport,
  resetChatSending,
  clearChatForTask,
} = agentChatSlice.actions;

export type AgentChatRootState = { agentChat?: AgentChatState };

export const selectChatMessages = (state: AgentChatRootState, taskId: string) =>
  state.agentChat?.messagesByTaskId?.[taskId] ?? [];

export const selectChatSending = (state: AgentChatRootState, taskId: string) =>
  state.agentChat?.sendingByTaskId?.[taskId] ?? false;

export const selectChatSupport = (state: AgentChatRootState, taskId: string) =>
  state.agentChat?.supportByTaskId?.[taskId] ?? { supported: true };

export default agentChatSlice.reducer;
