import Groq from "groq-sdk";
import { LAILA_SYSTEM_PROMPT } from "./laila-persona";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function chatWithLaila(
  messages: ChatMessage[],
): Promise<string> {
  // Filter out the initial greeting from assistant (local-only message)
  const filteredMessages = messages.filter(
    (_, index) => !(index === 0 && messages[0].role === "assistant")
  );

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: LAILA_SYSTEM_PROMPT },
      ...filteredMessages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    ],
    max_tokens: 1024,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
}
