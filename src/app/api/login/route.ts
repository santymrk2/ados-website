import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_OPTIONS,
  AUTH_ROLES,
  REQUIRED_AUTH_ENV_VARS,
  apiRateLimited,
  createAuthCookieValue,
  getMissingEnvVars,
  handleApiError,
  parseBody,
  type AuthRole,
} from "@/lib/api-utils";
import { loginSchema } from "@/lib/validation";
import { timingSafeEqual } from "crypto";
import { UnauthorizedError } from "@/lib/errors";

function passwordsMatch(input: string, expected: string): boolean {
  const inputBuffer = Buffer.from(input);
  const expectedBuffer = Buffer.from(expected);

  return (
    inputBuffer.length === expectedBuffer.length &&
    timingSafeEqual(inputBuffer, expectedBuffer)
  );
}

const MAX_FAILED_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

// In-memory (per instance) failed-attempt counter keyed by client IP
const failedAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_TRACKED_CLIENTS = 5000;

// The reverse proxy (Traefik in Dokploy) APPENDS the real client IP to X-Forwarded-For,
// so the last entry is trustworthy; earlier entries are whatever the client sent.
function getClientKey(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",").map((ip) => ip.trim()).filter(Boolean);
  return forwarded?.at(-1) || request.headers.get("x-real-ip")?.trim() || "unknown";
}

function pruneExpired(now: number) {
  for (const [key, entry] of failedAttempts) {
    if (entry.resetAt <= now) failedAttempts.delete(key);
  }
}

function isRateLimited(key: string) {
  const entry = failedAttempts.get(key);
  if (!entry) return false;
  if (entry.resetAt <= Date.now()) {
    failedAttempts.delete(key);
    return false;
  }
  return entry.count >= MAX_FAILED_ATTEMPTS;
}

function registerFailure(key: string) {
  const now = Date.now();
  const entry = failedAttempts.get(key);
  if (!entry || entry.resetAt <= now) {
    if (failedAttempts.size >= MAX_TRACKED_CLIENTS) pruneExpired(now);
    failedAttempts.set(key, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientKey = getClientKey(request);
    if (isRateLimited(clientKey)) {
      return apiRateLimited("Demasiados intentos. Probá de nuevo en unos minutos.");
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
      registerFailure(clientKey);
      throw new UnauthorizedError("Contraseña incorrecta");
    }

    failedAttempts.delete(clientKey);

    const response = NextResponse.json({ success: true, role: authenticatedRole });
    response.cookies.set(AUTH_COOKIE_NAME, createAuthCookieValue(authenticatedRole), AUTH_COOKIE_OPTIONS);
    return response;
  } catch (e) {
    return handleApiError(e);
  }
}
