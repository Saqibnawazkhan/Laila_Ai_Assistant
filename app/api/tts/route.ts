import { NextRequest } from "next/server";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

// Voice configuration
const VOICE_EN = "en-US-JennyNeural"; // Friendly female English voice
const VOICE_UR = "ur-PK-UzmaNeural"; // Pakistani Urdu female voice

export async function POST(request: NextRequest) {
  try {
    const { text, voice } = await request.json();

    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "No text provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Select voice - default to English Jenny
    const selectedVoice = voice === "urdu" ? VOICE_UR : VOICE_EN;

    const tts = new MsEdgeTTS();
    await tts.setMetadata(
      selectedVoice,
      OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3
    );

    // Collect audio stream into a buffer
    const { audioStream } = tts.toStream(text, {
      rate: 0.05, // Slightly above normal for natural assistant feel
      pitch: "+5Hz",
    });

    const chunks: Buffer[] = [];

    return new Promise<Response>((resolve) => {
      audioStream.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });

      audioStream.on("close", () => {
        const audioBuffer = Buffer.concat(chunks);
        tts.close();

        resolve(
          new Response(audioBuffer, {
            status: 200,
            headers: {
              "Content-Type": "audio/mpeg",
              "Content-Length": audioBuffer.length.toString(),
              "Cache-Control": "no-cache",
            },
          })
        );
      });

      audioStream.on("error", (err: Error) => {
        console.error("TTS stream error:", err);
        tts.close();
        resolve(
          new Response(JSON.stringify({ error: "TTS generation failed" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          })
        );
      });
    });
  } catch (error) {
    console.error("TTS API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate speech" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
