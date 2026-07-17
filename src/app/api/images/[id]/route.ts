import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, minioConfig } from "@/services/minio";
import { handleApiError, requireAuth } from "@/lib/api-utils";
import { AppError, NotFoundError } from "@/lib/errors";
import { imagesEnabled } from "@/lib/images-config";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!imagesEnabled) {
    return NextResponse.json({ success: false, error: "Imágenes deshabilitadas" }, { status: 404 });
  }

  const auth = requireAuth(request);
  if (!auth.success) {
    return auth.error;
  }

  try {
    const { id } = await context.params;

    if (!id) {
      throw new AppError("Nombre de archivo faltante", 400);
    }

    if (!minioConfig.isConfigured) {
      throw new AppError("El almacenamiento de imágenes no está configurado", 503);
    }

    const command = new GetObjectCommand({
      Bucket: minioConfig.bucket,
      Key: id,
    });

    const result = await s3Client.send(command);

    if (!result.Body) {
      throw new NotFoundError("Imagen no encontrada");
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
    if (e instanceof Error) {
      if (e.name === "NoSuchKey") {
        return NextResponse.json({ success: false, error: "Imagen no encontrada" }, { status: 404 });
      }
      if (e.name === "AccessDenied") {
        console.error("[API Images] Access denied to MinIO:", e.message);
        return NextResponse.json({ success: false, error: "Almacenamiento de imágenes no disponible" }, { status: 503 });
      }
      if (e.message?.includes("ENOTFOUND") || e.message?.includes("ECONNREFUSED")) {
        console.error("[API Images] Cannot connect to MinIO:", e.message);
        return NextResponse.json({ success: false, error: "Almacenamiento de imágenes no disponible" }, { status: 503 });
      }
    }
    return handleApiError(e);
  }
}

