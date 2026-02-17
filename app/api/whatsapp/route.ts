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
    // Uses Cmd+F for search (more reliable than Cmd+N in newer WhatsApp versions)
    const script = `
      tell application "WhatsApp" to activate
      delay 2.5

      tell application "System Events"
        tell process "WhatsApp"
          -- Click on the search/new chat area (Cmd+N for new chat)
          keystroke "n" using command down
          delay 1.5

          -- Clear any existing text and type contact name
          keystroke "a" using command down
          delay 0.2
          keystroke "${contact.replace(/"/g, '\\"')}"
          delay 2.5

          -- Press down arrow to select first search result
          key code 125
          delay 0.5
          -- Press Enter to open the chat
          key code 36
          delay 1.5

          ${message ? `
          -- Type the message
          keystroke "${message.replace(/"/g, '\\"')}"
          delay 0.5

          -- Press Enter to send
          key code 36
          delay 0.5
          ` : ""}
        end tell
      end tell
    `;

    await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, {
      timeout: 20000,
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
