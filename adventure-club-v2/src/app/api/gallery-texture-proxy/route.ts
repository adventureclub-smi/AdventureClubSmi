import { NextRequest, NextResponse } from "next/server";

// WebGL texture upload requires the image response to actually carry CORS
// headers, unlike a plain <img> — and the R2/Cloudflare-fronted media host
// this project serves photos from doesn't send any (never needed to, since
// every other use on the site is a normal <img>/next/image). Fetching the
// bytes here and re-serving them from our own origin sidesteps that
// entirely: same-origin responses aren't subject to CORS at all. Scoped to
// the one host we actually trust, so this can't be used as an open proxy.
const ALLOWED_HOST = "media.adventureclubsmi.com";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ message: "Missing url." }, { status: 400 });
  }

  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ message: "Invalid url." }, { status: 400 });
  }

  if (parsed.protocol !== "https:" || parsed.hostname !== ALLOWED_HOST) {
    return NextResponse.json({ message: "Host not allowed." }, { status: 400 });
  }

  try {
    const upstream = await fetch(parsed.toString());

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ message: "Failed to fetch image." }, { status: 502 });
    }

    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "image/webp",
        // These are already-uploaded, immutable gallery assets — safe to
        // cache hard on both the browser and any CDN in front of this route.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ message: "Failed to fetch image." }, { status: 502 });
  }
}
