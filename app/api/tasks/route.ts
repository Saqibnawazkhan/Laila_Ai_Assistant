import { NextRequest, NextResponse } from "next/server";
import { getAllTasks, createTask, clearAllTasks } from "@/lib/db";

// GET /api/tasks — List all tasks
export async function GET() {
  try {
    const tasks = getAllTasks();
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Failed to load tasks:", error);
    return NextResponse.json({ tasks: [] });
  }
}

// POST /api/tasks — Create a new task
export async function POST(request: NextRequest) {
  try {
    const { id, title, priority, dueDate } = await request.json();

    if (!id || !title) {
      return NextResponse.json({ error: "id and title required" }, { status: 400 });
    }

    const task = createTask(id, title, priority || "medium", dueDate || null);
    return NextResponse.json({ task });
  } catch (error) {
    console.error("Failed to create task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

// DELETE /api/tasks — Clear all tasks
export async function DELETE() {
  try {
    clearAllTasks();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to clear tasks:", error);
    return NextResponse.json({ error: "Failed to clear tasks" }, { status: 500 });
  }
}
