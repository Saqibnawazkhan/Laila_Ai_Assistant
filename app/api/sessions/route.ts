import { NextRequest, NextResponse } from "next/server";
import { getAllSessions, createSession, clearAllSessions } from "@/lib/db";

// GET /api/sessions — List all chat sessions
export async function GET() {
  try {
    const sessions = getAllSessions();
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Failed to load sessions:", error);
    return NextResponse.json({ sessions: [] });
  }
}

// POST /api/sessions — Create a new session
export async function POST(request: NextRequest) {
  try {
    const { id, title } = await request.json();

    if (!id || !title) {
      return NextResponse.json({ error: "id and title required" }, { status: 400 });
    }

    const session = createSession(id, title);
    return NextResponse.json({ session });
  } catch (error) {
    console.error("Failed to create session:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}

// DELETE /api/sessions — Clear all sessions
export async function DELETE() {
  try {
    clearAllSessions();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to clear sessions:", error);
    return NextResponse.json({ error: "Failed to clear sessions" }, { status: 500 });
  }
}
