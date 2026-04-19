import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, role } = body;

    const DEFAULT_ADMIN_PASSWORD = "activados2026";
    const DEFAULT_VIEWER_PASSWORD = "viewer2026";

    const adminPassword = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
    const viewerPassword = process.env.VIEWER_PASSWORD || DEFAULT_VIEWER_PASSWORD;

    if (role === "admin") {
      if (password === adminPassword) {
        return NextResponse.json({ success: true, role: "admin" });
      }
    } else if (role === "viewer") {
      if (password === viewerPassword) {
        return NextResponse.json({ success: true, role: "viewer" });
      }
    } else {
      if (password === adminPassword) {
        return NextResponse.json({ success: true, role: "admin" });
      }
    }

    return NextResponse.json({ success: false, error: "Contraseña incorrecta" }, { status: 401 });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Error en el servidor" }, { status: 500 });
  }
}