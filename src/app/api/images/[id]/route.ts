import { NextRequest, NextResponse } from "next/server";
import { getImageUrl } from "@/services/minio";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    
    if (!id) {
      return NextResponse.json({ error: "Missing filename" }, { status: 400 });
    }

    // getImageUrl returns a signed URL from MinIO (or data: uri if it was legacy)
    const signedUrl = await getImageUrl(id);
    
    if (!signedUrl) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Redirect the browser to the signed URL (MinIO)
    return NextResponse.redirect(signedUrl);
  } catch (e) {
    console.error("[API Images] Error serving image:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
