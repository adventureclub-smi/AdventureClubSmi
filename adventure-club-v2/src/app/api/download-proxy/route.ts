import { NextRequest, NextResponse } from "next/server";

// A plain <a download> only honors the download hint for a same-origin URL —
// for a cross-origin one (like an admin-uploaded QR image on R2's media
// host) browsers just navigate to it instead. Re-serving the bytes from our
// own origin with Content-Disposition: attachment forces the actual save
// dialog. Scoped to the one host this project actually trusts, same as
// gallery-texture-proxy, so this can't be used as an open proxy.
const ALLOWED_HOST = "media.adventureclubsmi.com";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const filename = req.nextUrl.searchParams.get("filename") || "download";

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
      return NextResponse.json({ message: "Failed to fetch file." }, { status: 502 });
    }

    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename.replace(/"/g, "")}"`,
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ message: "Failed to fetch file." }, { status: 502 });
  }
}
