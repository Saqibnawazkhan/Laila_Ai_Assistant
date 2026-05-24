import { NextRequest, NextResponse } from "next/server";

const YT_ID = "[a-zA-Z0-9_-]{11}";

// Look in priority order for organic results. videoRenderer is the standard
// search-result entry; compactVideoRenderer appears on the mobile variant;
// any "videoId":"…" is the last-resort fallback.
const PATTERNS: RegExp[] = [
  new RegExp(`"videoRenderer":\\{"videoId":"(${YT_ID})"`),
  new RegExp(`"compactVideoRenderer":\\{"videoId":"(${YT_ID})"`),
  new RegExp(`"videoId":"(${YT_ID})"`),
];

function extractVideoId(html: string): string | null {
  for (const pattern of PATTERNS) {
    const m = html.match(pattern);
    if (m) return m[1];
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "No query" }, { status: 400 });
    }

    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

    // 6s timeout — YouTube usually responds in under a second, anything longer is a hang
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    let html: string;
    try {
      const response = await fetch(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
        signal: controller.signal,
      });
      html = await response.text();
    } finally {
      clearTimeout(timeout);
    }

    const videoId = extractVideoId(html);

    if (!videoId) {
      return NextResponse.json({
        success: false,
        url: searchUrl,
      });
    }

    return NextResponse.json({
      success: true,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      videoId,
    });
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return NextResponse.json(
      { error: aborted ? "YouTube search timed out" : "Failed to search YouTube" },
      { status: 500 },
    );
  }
}
