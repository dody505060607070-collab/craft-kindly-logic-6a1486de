import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function createLovableAiGatewayProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "lovable-ai-gateway",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": apiKey },
  });
}

/**
 * Resolve an AI model that works both on Lovable (LOVABLE_API_KEY) and on
 * external hosts like Vercel (GROQ_API_KEY, or any OpenAI-compatible
 * AI_API_KEY + AI_BASE_URL + AI_MODEL).
 */
export function resolveAiModel() {
  const lovableKey = process.env.LOVABLE_API_KEY;
  if (lovableKey) {
    const gateway = createLovableAiGatewayProvider(lovableKey);
    return gateway(process.env.AI_MODEL || "google/gemini-3.6-flash");
  }

  const customKey = process.env.AI_API_KEY;
  if (customKey) {
    const provider = createOpenAICompatible({
      name: "custom-ai",
      baseURL: process.env.AI_BASE_URL || "https://api.openai.com/v1",
      headers: { Authorization: `Bearer ${customKey}` },
    });
    return provider(process.env.AI_MODEL || "gpt-4o-mini");
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    const provider = createOpenAICompatible({
      name: "groq",
      baseURL: "https://api.groq.com/openai/v1",
      headers: { Authorization: `Bearer ${groqKey}` },
    });
    return provider(process.env.AI_MODEL || "llama-3.3-70b-versatile");
  }

  throw new Error("خدمة الذكاء الاصطناعي غير مهيأة — أضف LOVABLE_API_KEY أو GROQ_API_KEY");
}
