import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing URL parameter" }, { status: 400 });
  }

  try {
    const cleanUrl = url.trim();
    
    // If it's already a direct link or not an ImgBB link, return it
    if (cleanUrl.includes("i.ibb.co") || !cleanUrl.includes("ibb.co")) {
      return NextResponse.json({ resolvedUrl: cleanUrl });
    }

    const response = await fetch(cleanUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ resolvedUrl: cleanUrl });
    }

    const html = await response.text();
    // Match og:image meta tag
    const match = html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i) || 
                  html.match(/<meta\s+content=["'](.*?)["']\s+property=["']og:image["']/i);
    
    if (match && match[1]) {
      return NextResponse.json({ resolvedUrl: match[1] });
    }

    return NextResponse.json({ resolvedUrl: cleanUrl });
  } catch (error) {
    console.error("Error resolving image URL:", error);
    return NextResponse.json({ resolvedUrl: url });
  }
}
