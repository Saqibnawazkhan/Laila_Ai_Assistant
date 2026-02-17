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

export async function chatWithLaila(
  messages: ChatMessage[],
): Promise<string> {
  // Filter out the initial greeting from assistant (local-only message)
  const filteredMessages = messages.filter(
    (_, index) => !(index === 0 && messages[0].role === "assistant")
  );

  // Limit conversation history to last 20 messages to reduce token usage
  const recentMessages = filteredMessages.slice(-20);

  // Retry with exponential backoff for rate limits
  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: LAILA_SYSTEM_PROMPT },
          ...recentMessages.map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          })),
        ],
        max_tokens: 1024,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "";
      const isRateLimit = msg.includes("429") || msg.includes("rate") || msg.includes("quota");

      if (isRateLimit && attempt < maxRetries - 1) {
        // Wait 2s, 4s, 8s between retries
        await sleep(2000 * Math.pow(2, attempt));
        continue;
      }
      throw error;
    }
  }

  return "Sorry, I couldn't generate a response.";
}
