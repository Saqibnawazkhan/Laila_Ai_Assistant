import { NextRequest, NextResponse } from "next/server";
import { toggleTaskDb, deleteTaskDb } from "@/lib/db";

// PATCH /api/tasks/[id] — Toggle a task's completion
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    toggleTaskDb(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to toggle task:", error);
    return NextResponse.json({ error: "Failed to toggle task" }, { status: 500 });
  }
}

// DELETE /api/tasks/[id] — Delete a single task
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    deleteTaskDb(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete task:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
