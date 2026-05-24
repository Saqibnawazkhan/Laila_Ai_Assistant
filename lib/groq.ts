import Groq from "groq-sdk";
import { LAILA_SYSTEM_PROMPT } from "./laila-persona";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Helper: sleep for ms
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Models in order of preference - fallback if rate limited
const MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
];

async function tryModel(
  model: string,
  systemPrompt: string,
  recentMessages: ChatMessage[],
): Promise<string> {
  const response = await groq.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      ...recentMessages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    ],
    max_tokens: 1024,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || "";
}

export async function chatWithLaila(
  messages: ChatMessage[],
): Promise<string> {
  // Filter out the initial greeting from assistant (local-only message)
  const filteredMessages = messages.filter(
    (_, index) => !(index === 0 && messages[0].role === "assistant")
  );

  // Limit conversation history to last 10 messages to reduce token usage
  const recentMessages = filteredMessages.slice(-10);

  // Try each model, falling back on rate limit
  for (let m = 0; m < MODELS.length; m++) {
    const model = MODELS[m];

    // Retry with backoff for each model
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await tryModel(model, LAILA_SYSTEM_PROMPT, recentMessages);
        return result || "Sorry, I couldn't generate a response.";
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "";
        const isRateLimit = msg.includes("429") || msg.includes("rate") || msg.includes("quota");

        if (isRateLimit) {
          if (attempt === 0) {
            // First retry - wait briefly then try same model
            await sleep(1500);
            continue;
          }
          // Rate limited after retry - try next model
          break;
        }
        throw error;
      }
    }
  }

  return "Sorry, I couldn't generate a response. Please try again in a moment.";
}
