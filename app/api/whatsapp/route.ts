import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Shared AppleScript for searching a contact and opening their chat
function searchContactScript(safeContact: string): string {
  return `
    tell application "WhatsApp" to activate
    delay 2

    tell application "System Events"
      tell process "WhatsApp"
        -- Press Escape to close any open panels
        key code 53
        delay 0.5

        -- Find and click the Search field
        set searchClicked to false

        -- Method 1: Look for search text field by placeholder
        try
          set allTextFields to every text field of window 1
          repeat with aField in allTextFields
            set pVal to ""
            try
              set pVal to value of attribute "AXPlaceholderValue" of aField
            end try
            if pVal contains "Search" or pVal contains "search" then
              click aField
              set searchClicked to true
              exit repeat
            end if
          end repeat
        end try

        -- Method 2: Search in groups/scroll areas
        if not searchClicked then
          try
            set allGroups to every group of window 1
            repeat with aGroup in allGroups
              try
                set groupFields to every text field of aGroup
                repeat with gField in groupFields
                  set pVal2 to ""
                  try
                    set pVal2 to value of attribute "AXPlaceholderValue" of gField
                  end try
                  if pVal2 contains "Search" or pVal2 contains "search" then
                    click gField
                    set searchClicked to true
                    exit repeat
                  end if
                end repeat
              end try
              if searchClicked then exit repeat
            end repeat
          end try
        end if

        -- Method 3: Fallback Cmd+F
        if not searchClicked then
          keystroke "f" using command down
          delay 0.5
        end if

        delay 1

        -- Search for the contact
        keystroke "a" using command down
        delay 0.2
        set the clipboard to "${safeContact}"
        keystroke "v" using command down
        delay 3

        -- Select first result
        key code 36
        delay 1
        key code 125
        delay 0.3
        key code 36
        delay 2
  `;
}

export async function POST(request: NextRequest) {
  try {
    const { contact, message } = await request.json();

    if (!contact) {
      return NextResponse.json({ error: "No contact provided" }, { status: 400 });
    }

    const isVoiceCall = message === "__CALL__";
    const isVideoCall = message === "__VIDEO_CALL__";
    const isCall = isVoiceCall || isVideoCall;

    const safeContact = contact.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const safeMessage = (!isCall && message) ? message.replace(/\\/g, '\\\\').replace(/"/g, '\\"') : "";

    let script: string;

    if (isCall) {
      // --- CALL SCRIPT ---
      // Strategy: Navigate to contact, then click call button using position-based approach
      // WhatsApp Mac has call buttons in the top-right of the chat header area
      script = searchContactScript(safeContact) + `

            -- Now we're in the chat. Find and click the call button.
            -- WhatsApp Mac: call buttons are in the top-right toolbar of the chat panel.

            -- Get window position and size
            set winPos to position of window 1
            set winSize to size of window 1
            set winX to item 1 of winPos
            set winY to item 2 of winPos
            set winW to item 1 of winSize
            set winH to item 2 of winSize

            -- Strategy 1: Deep recursive button search
            -- Search all UI elements for buttons with call-related attributes
            set callClicked to false

            -- Try to find buttons by traversing groups recursively (2 levels deep)
            try
              set topElements to every UI element of window 1
              repeat with elem in topElements
                if not callClicked then
                  try
                    -- Check direct buttons
                    if role of elem is "AXButton" then
                      set d to ""
                      try
                        set d to description of elem
                      end try
                      set t to ""
                      try
                        set t to title of elem
                      end try
                      set combined to d & " " & t
                      if combined contains "${isVideoCall ? "video" : "call"}" or combined contains "${isVideoCall ? "Video" : "Call"}" or combined contains "${isVideoCall ? "camera" : "phone"}" or combined contains "${isVideoCall ? "Camera" : "Phone"}" then
                        click elem
                        set callClicked to true
                      end if
                    end if
                  end try

                  -- Check children
                  if not callClicked then
                    try
                      set subElements to every UI element of elem
                      repeat with subElem in subElements
                        if not callClicked then
                          try
                            if role of subElem is "AXButton" then
                              set d2 to ""
                              try
                                set d2 to description of subElem
                              end try
                              set t2 to ""
                              try
                                set t2 to title of subElem
                              end try
                              set combined2 to d2 & " " & t2
                              if combined2 contains "${isVideoCall ? "video" : "call"}" or combined2 contains "${isVideoCall ? "Video" : "Call"}" or combined2 contains "${isVideoCall ? "camera" : "phone"}" or combined2 contains "${isVideoCall ? "Camera" : "Phone"}" then
                                click subElem
                                set callClicked to true
                              end if
                            end if
                          end try

                          -- Go one more level deep
                          if not callClicked then
                            try
                              set subSubElements to every UI element of subElem
                              repeat with sss in subSubElements
                                if not callClicked then
                                  try
                                    if role of sss is "AXButton" then
                                      set d3 to ""
                                      try
                                        set d3 to description of sss
                                      end try
                                      set t3 to ""
                                      try
                                        set t3 to title of sss
                                      end try
                                      set combined3 to d3 & " " & t3
                                      if combined3 contains "${isVideoCall ? "video" : "call"}" or combined3 contains "${isVideoCall ? "Video" : "Call"}" or combined3 contains "${isVideoCall ? "camera" : "phone"}" or combined3 contains "${isVideoCall ? "Camera" : "Phone"}" then
                                        click sss
                                        set callClicked to true
                                      end if
                                    end if
                                  end try
                                end if
                              end repeat
                            end try
                          end if
                        end if
                      end repeat
                    end try
                  end if
                end if
              end repeat
            end try

            -- Strategy 2: Position-based click as fallback
            -- WhatsApp Mac: the voice call button is near top-right of window
            -- Typically at around (window_right - 90, window_top + 38) for voice
            -- and (window_right - 55, window_top + 38) for video
            if not callClicked then
              ${isVideoCall
                ? 'click at {winX + winW - 55, winY + 38}'
                : 'click at {winX + winW - 90, winY + 38}'}
              delay 0.5
            end if

            delay 1
          end tell
        end tell
      `;
    } else {
      // --- MESSAGE SCRIPT ---
      script = searchContactScript(safeContact) + `

            ${safeMessage ? `
            -- Click on the message input area
            try
              set msgFields to every text field of window 1
              if (count of msgFields) > 1 then
                click item (count of msgFields) of msgFields
                delay 0.3
              end if
            end try

            -- Paste and send message
            set the clipboard to "${safeMessage}"
            keystroke "v" using command down
            delay 0.5
            key code 36
            delay 0.5
            ` : ""}
          end tell
        end tell
      `;
    }

    await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, {
      timeout: 30000,
      shell: "/bin/zsh",
    });

    let output: string;
    if (isVoiceCall) {
      output = `Calling ${contact} on WhatsApp...`;
    } else if (isVideoCall) {
      output = `Starting video call with ${contact} on WhatsApp...`;
    } else if (safeMessage) {
      output = `Sent "${message}" to ${contact} on WhatsApp`;
    } else {
      output = `Opened chat with ${contact} on WhatsApp`;
    }

    return NextResponse.json({ success: true, output });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed";

    if (msg.includes("not allowed assistive access") || msg.includes("System Events")) {
      return NextResponse.json({
        success: false,
        output: "I need Accessibility permission to control WhatsApp. Please go to System Settings > Privacy & Security > Accessibility and add your terminal app.",
      });
    }

    return NextResponse.json({
      success: false,
      output: `Couldn't complete the WhatsApp action: ${msg}`,
    });
  }
}
