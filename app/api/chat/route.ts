import { NextRequest, NextResponse } from "next/server";
import { chatWithLaila, ChatMessage } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const { messages }: { messages: ChatMessage[] } = await request.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "No messages provided" },
        { status: 400 }
      );
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "Please set your GROQ_API_KEY in .env.local file" },
        { status: 500 }
      );
    }

    const reply = await chatWithLaila(messages);

    return NextResponse.json({ reply });
  } catch (error: unknown) {
    console.error("Chat API error:", error);
    const rawMessage = error instanceof Error ? error.message : "Something went wrong";

    let friendlyMessage = "Something went wrong. Please try again.";
    if (rawMessage.includes("429") || rawMessage.includes("quota") || rawMessage.includes("rate")) {
      friendlyMessage = "I'm a bit overwhelmed right now! Too many requests. Please wait a moment and try again.";
    } else if (rawMessage.includes("API key") || rawMessage.includes("401") || rawMessage.includes("403")) {
      friendlyMessage = "There's an issue with the API key. Please check your GROQ_API_KEY in the .env.local file.";
    } else if (rawMessage.includes("network") || rawMessage.includes("fetch")) {
      friendlyMessage = "I can't reach the server right now. Please check your internet connection.";
    }

    return NextResponse.json({ error: friendlyMessage }, { status: 500 });
  }
}
