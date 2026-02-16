import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "No query" }, { status: 400 });
    }

    // Fetch YouTube search page and extract first video ID
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    const html = await response.text();

    // Extract first video ID from the YouTube page
    const videoIdMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);

    if (!videoIdMatch) {
      return NextResponse.json({
        success: false,
        url: searchUrl, // Fallback to search page
      });
    }

    const videoId = videoIdMatch[1];
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

    return NextResponse.json({
      success: true,
      url: watchUrl,
      videoId,
    });
  } catch {
    return NextResponse.json({ error: "Failed to search YouTube" }, { status: 500 });
  }
}
