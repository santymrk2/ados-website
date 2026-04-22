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

    const command = new GetObjectCommand({
      Bucket: minioConfig.bucket,
      Key: id,
    });

    const result = await s3Client.send(command);

    if (!result.Body) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // transformToByteArray es el método más confiable del AWS SDK
    const bytes = await result.Body.transformToByteArray();
    const buffer = Buffer.from(bytes);
    const contentType = result.ContentType || "image/jpeg";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e: any) {
    if (e?.name === "NoSuchKey") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("[API Images] Error proxying image:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

