import { NextRequest, NextResponse } from "next/server";
import { getImageUrl } from "@/services/minio";

export const dynamic = "force-dynamic";

const MAX_RETRIES = 3;
const FETCH_TIMEOUT_MS = 10000;

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (response.ok) return response;

      // If MinIO returns a server error, retry; otherwise return as-is
      if (response.status >= 500 && attempt < retries) {
        await new Promise((r) => setTimeout(r, 100 * attempt));
        continue;
      }

      return response;
    } catch (err) {
      if (attempt === retries) throw err;
      // Exponential backoff: 100ms, 200ms, 400ms...
      await new Promise((r) => setTimeout(r, 100 * Math.pow(2, attempt - 1)));
    }
  }
  // Should never reach here, but satisfy TS
  throw new Error("Max retries exceeded");
}

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

    // Proxy con retry: el servidor descarga la imagen y la sirve al cliente
    const response = await fetchWithRetry(signedUrl);

    if (!response.ok) {
      console.error(`[API Images] Storage returned ${response.status} for key: ${id}`);
      return NextResponse.json({ error: "Error fetching from storage" }, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e) {
    console.error("[API Images] Error proxying image:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
