import { NextRequest, NextResponse } from "next/server";
import { getSession, saveMessages, deleteSessionDb } from "@/lib/db";

// GET /api/sessions/[id] — Get a session with its messages
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = getSession(id);

    if (!result) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({
      session: {
        id: result.session.id,
        title: result.session.title,
        createdAt: result.session.created_at,
        updatedAt: result.session.updated_at,
        messages: result.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      },
    });
  } catch (error) {
    console.error("Failed to get session:", error);
    return NextResponse.json({ error: "Failed to get session" }, { status: 500 });
  }
}

// PUT /api/sessions/[id] — Update session messages
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages array required" }, { status: 400 });
    }

    saveMessages(id, messages);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update session:", error);
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}

// DELETE /api/sessions/[id] — Delete a session
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    deleteSessionDb(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete session:", error);
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
  }
}
