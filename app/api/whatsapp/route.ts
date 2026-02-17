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

    // AppleScript to open WhatsApp, search contact, paste message, and send
    // Uses clipboard paste instead of keystroke to avoid typos
    // Escapes special characters for AppleScript string
    const safeContact = contact.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const safeMessage = message ? message.replace(/\\/g, '\\\\').replace(/"/g, '\\"') : "";

    const script = `
      tell application "WhatsApp" to activate
      delay 2

      tell application "System Events"
        tell process "WhatsApp"
          -- First press Escape to close any open dialogs/panels
          key code 53
          delay 0.5

          -- Open new chat search using Cmd+N
          keystroke "n" using command down
          delay 2

          -- Use clipboard to paste contact name (avoids typos)
          set the clipboard to "${safeContact}"
          keystroke "v" using command down
          delay 3

          -- Press down arrow to select first search result, then Enter to open chat
          key code 125
          delay 0.5
          key code 36
          delay 2

          ${message ? `
          -- Use clipboard to paste message (avoids typos like "How areyu")
          set the clipboard to "${safeMessage}"
          keystroke "v" using command down
          delay 0.5

          -- Press Enter to send
          key code 36
          delay 0.5
          ` : ""}
        end tell
      end tell
    `;

    await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, {
      timeout: 25000,
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
