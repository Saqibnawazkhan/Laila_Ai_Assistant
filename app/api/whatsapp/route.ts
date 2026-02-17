import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { contact, message } = await request.json();

    if (!contact) {
      return NextResponse.json({ error: "No contact provided" }, { status: 400 });
    }

    // AppleScript to open WhatsApp, search contact, type message, and send
    const script = `
      tell application "WhatsApp" to activate
      delay 2

      tell application "System Events"
        tell process "WhatsApp"
          -- Open new chat / search
          keystroke "n" using command down
          delay 1

          -- Type contact name to search
          keystroke "${contact.replace(/"/g, '\\"')}"
          delay 1.5

          -- Press down arrow to select first result, then Enter
          key code 125
          delay 0.3
          key code 36
          delay 1

          ${message ? `
          -- Type the message
          keystroke "${message.replace(/"/g, '\\"')}"
          delay 0.5

          -- Press Enter to send
          key code 36
          ` : ""}
        end tell
      end tell
    `;

    await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, {
      timeout: 15000,
      shell: "/bin/zsh",
    });

    return NextResponse.json({
      success: true,
      output: message
        ? `Sent "${message}" to ${contact} on WhatsApp`
        : `Opened chat with ${contact} on WhatsApp`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed";

    // Check if it's an accessibility permission issue
    if (msg.includes("not allowed assistive access") || msg.includes("System Events")) {
      return NextResponse.json({
        success: false,
        output: "I need Accessibility permission to control WhatsApp. Please go to System Settings > Privacy & Security > Accessibility and add your terminal app.",
      });
    }

    return NextResponse.json({
      success: false,
      output: `Couldn't send the message: ${msg}`,
    });
  }
}
