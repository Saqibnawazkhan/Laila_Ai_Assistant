import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Commands that are never allowed
const BLOCKED_PATTERNS = [
  /rm\s+-rf\s+\//,      // rm -rf /
  /mkfs/,                // format disk
  /dd\s+if=/,            // disk destroyer
  />\s*\/dev\//,         // write to device
  /sudo\s+rm/,           // sudo remove
  /shutdown/,            // shutdown
  /reboot/,              // reboot
  /launchctl\s+unload/,  // unload system services
];

export async function POST(request: NextRequest) {
  try {
    const { command, type } = await request.json();

    if (!command || typeof command !== "string") {
      return NextResponse.json(
        { error: "No command provided" },
        { status: 400 }
      );
    }

    // Safety check: block dangerous commands
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(command)) {
        return NextResponse.json(
          { error: "This command has been blocked for safety. It could damage your system." },
          { status: 403 }
        );
      }
    }

    // Execute the command with a timeout
    const { stdout, stderr } = await execAsync(command, {
      timeout: 15000, // 15 second timeout (allows sleep commands for automation)
      maxBuffer: 1024 * 512, // 512KB max output
      shell: "/bin/zsh",
    });

    const output = stdout || stderr || `Command executed successfully: ${type}`;

    return NextResponse.json({
      success: true,
      output: output.trim().slice(0, 2000), // Limit output size
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Command failed";

    // Clean up error message
    let friendlyError = message;
    if (message.includes("ETIMEDOUT") || message.includes("timeout")) {
      friendlyError = "Command timed out (took longer than 10 seconds).";
    } else if (message.includes("ENOENT")) {
      friendlyError = "Command or application not found.";
    }

    return NextResponse.json({
      success: false,
      output: friendlyError,
    });
  }
}
