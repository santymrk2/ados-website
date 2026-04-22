import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, minioConfig } from "@/services/minio";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Missing filename" }, { status: 400 });
    }

    // Obtener el objeto directamente desde MinIO via S3 SDK (conexión interna)
    const command = new GetObjectCommand({
      Bucket: minioConfig.bucket,
      Key: id,
    });

    const result = await s3Client.send(command);

    if (!result.Body) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Convertir el readable stream a un buffer
    const chunks: Uint8Array[] = [];
    const reader = result.Body.transformToWebStream().getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const buffer = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.length;
    }

    const contentType = result.ContentType || "image/jpeg";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e: any) {
    // S3 NoSuchKey = image doesn't exist
    if (e?.name === "NoSuchKey") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("[API Images] Error proxying image:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
