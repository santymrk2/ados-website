import { NextRequest, NextResponse } from "next/server";
import { getImageUrl } from "@/services/minio";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    
    if (!id) {
      return NextResponse.json({ error: "Missing filename" }, { status: 400 });
    }

    // Obtenemos la URL firmada (interna)
    const signedUrl = await getImageUrl(id);
    
    if (!signedUrl) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Proxy: El servidor descarga la imagen y la sirve al cliente
    const response = await fetch(signedUrl);
    
    if (!response.ok) {
      return NextResponse.json({ error: "Error fetching from storage" }, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable", // Cache por 1 año
      },
    });
  } catch (e) {
    console.error("[API Images] Error proxying image:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
