const missingOpenAiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!missingOpenAiKey && import.meta.env.DEV) {
  console.warn('OpenAI API key is missing. Wire VITE_OPENAI_API_KEY for AI actions.');
}

export const aiConfig = {
  hasApiKey: Boolean(missingOpenAiKey),
};

export const createPromptPayload = (text) => ({
  input: text?.trim() || '',
  createdAt: new Date().toISOString(),
});
