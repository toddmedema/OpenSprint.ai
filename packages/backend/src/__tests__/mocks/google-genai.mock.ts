/**
 * Mock for @google/genai used in Vitest tests.
 * Resolves "Failed to load url @google/genai" when tests indirectly import agent-client.ts.
 */
export const GoogleGenAI = function mockGoogleGenAI() {
  return {
    models: {
      generateContent: () => Promise.resolve({ text: "" }),
      generateContentStream: () => Promise.resolve({}),
    },
  };
};
