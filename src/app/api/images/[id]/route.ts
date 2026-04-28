import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand, S3ServiceException } from "@aws-sdk/client-s3";
import { s3Client, minioConfig } from "@/services/minio";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Missing filename" }, { status: 400 });
    }

    // Verificar que MinIO esté configurado
    if (!minioConfig.isConfigured) {
      console.error("[API Images] MinIO not configured");
      return NextResponse.json({ error: "Image storage not configured" }, { status: 503 });
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
  } catch (e: unknown) {
    // Detectar errores específicos de S3
    if (e instanceof Error) {
      // NoSuchKey = archivo no existe
      if (e.name === "NoSuchKey" || (e as any).$metadata?.httpStatusCode === 404) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      // AccessDenied = credenciales inválidas
      if (e.name === "AccessDenied" || (e as any).$metadata?.httpStatusCode === 403) {
        console.error("[API Images] Access denied to MinIO:", e.message);
        return NextResponse.json({ error: "Image storage access denied" }, { status: 503 });
      }
      // Network errors = no puede conectar
      if (e.message?.includes("ENOTFOUND") || e.message?.includes("ECONNREFUSED")) {
        console.error("[API Images] Cannot connect to MinIO:", e.message);
        return NextResponse.json({ error: "Image storage unavailable" }, { status: 503 });
      }
    }
    console.error("[API Images] Error proxying image:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

