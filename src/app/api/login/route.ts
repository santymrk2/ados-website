import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_MAX_AGE_SECONDS,
  AUTH_ROLES,
  REQUIRED_AUTH_ENV_VARS,
  createAuthCookieValue,
  getMissingEnvVars,
  handleApiError,
  parseBody,
  type AuthRole,
} from "@/lib/api-utils";
import { loginSchema } from "@/lib/validation";
import { timingSafeEqual } from "crypto";
import { RateLimitError, UnauthorizedError } from "@/lib/errors";

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

function passwordsMatch(input: string, expected: string): boolean {
  const inputBuffer = Buffer.from(input);
  const expectedBuffer = Buffer.from(expected);

  return (
    inputBuffer.length === expectedBuffer.length &&
    timingSafeEqual(inputBuffer, expectedBuffer)
  );
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);

    // Check rate limit
    if (!checkRateLimit(clientIp)) {
      throw new RateLimitError("Demasiados intentos. Intenta en 15 minutos.");
    }

    const parsed = await parseBody(request, loginSchema);
    if (!parsed.success) {
      return parsed.error;
    }

    const { password, role } = parsed.data;

    // Require environment variables - no defaults!
    const missingEnvVars = getMissingEnvVars(REQUIRED_AUTH_ENV_VARS);
    if (missingEnvVars.length > 0) {
      console.error(`[AUTH] Missing required environment variables: ${missingEnvVars.join(", ")}`);
      return NextResponse.json(
        { success: false, error: "Error de configuración del servidor" },
        { status: 500 }
      );
    }

    const adminPassword = process.env.ADMIN_PASSWORD;
    const viewerPassword = process.env.VIEWER_PASSWORD;

    // Keep TypeScript honest even though the environment was checked above.
    if (!adminPassword || !viewerPassword) {
      return NextResponse.json(
        { success: false, error: "Error de configuración del servidor" },
        { status: 500 }
      );
    }

    let authenticatedRole: AuthRole | null = null;

    if (role === AUTH_ROLES.ADMIN) {
      if (passwordsMatch(password, adminPassword)) {
        authenticatedRole = AUTH_ROLES.ADMIN;
      }
    } else if (role === AUTH_ROLES.VIEWER) {
      if (passwordsMatch(password, viewerPassword)) {
        authenticatedRole = AUTH_ROLES.VIEWER;
      }
    } else {
      if (passwordsMatch(password, adminPassword)) {
        authenticatedRole = AUTH_ROLES.ADMIN;
      }
    }

    if (!authenticatedRole) {
      throw new UnauthorizedError("Contraseña incorrecta");
    }

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
    };

    const response = NextResponse.json({ success: true, role: authenticatedRole });
    response.cookies.set("activados_auth", createAuthCookieValue(authenticatedRole), cookieOptions);
    return response;
  } catch (e) {
    return handleApiError(e);
  }
}
