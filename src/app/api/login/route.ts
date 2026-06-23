import { NextRequest, NextResponse } from "next/server";
import { createAuthCookieValue } from "@/lib/api-utils";

// In-memory rate limiting: { ip: { count: number, resetTime: number } }
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_ATTEMPTS = 5;

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return false; // Rate limited
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);

    // Check rate limit
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { success: false, error: "Demasiados intentos. Intenta en 15 minutos." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { password, role } = body;

    // Require environment variables - no defaults!
    const adminPassword = process.env.ADMIN_PASSWORD;
    const viewerPassword = process.env.VIEWER_PASSWORD;

    // If passwords not configured, fail securely
    if (!adminPassword || !viewerPassword) {
      console.error("[AUTH] Passwords not configured in environment variables");
      return NextResponse.json(
        { success: false, error: "Error de configuración del servidor" },
        { status: 500 }
      );
    }

    let authenticatedRole: string | null = null;

    if (role === "admin") {
      if (password === adminPassword) {
        authenticatedRole = "admin";
      }
    } else if (role === "viewer") {
      if (password === viewerPassword) {
        authenticatedRole = "viewer";
      }
    } else {
      if (password === adminPassword) {
        authenticatedRole = "admin";
      }
    }

    if (!authenticatedRole) {
      return NextResponse.json({ success: false, error: "Contraseña incorrecta" }, { status: 401 });
    }

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    };

    const response = NextResponse.json({ success: true, role: authenticatedRole });
    response.cookies.set("activados_auth", createAuthCookieValue(authenticatedRole), cookieOptions);
    return response;
  } catch (e) {
    return NextResponse.json({ success: false, error: "Error en el servidor" }, { status: 500 });
  }
}
