import { NextRequest, NextResponse } from "next/server";
import { mediaService } from "@/modules/media/media.service";
import { getCurrentUser } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const maxResults = parseInt(searchParams.get("maxResults") || "6", 10);

    if (!query) {
      return NextResponse.json({ items: [] });
    }

    const items = await mediaService.searchYouTube(query, maxResults);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("YouTube Search Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
