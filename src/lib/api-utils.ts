/**
 * API Response Utilities
 * Provides consistent response formatting across all API routes
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Pagination utility
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function getPagination(request: NextRequest): { page: number; limit: number } {
  const page = parseInt(request.nextUrl.searchParams.get("page") || "1", 10);
  const limit = parseInt(request.nextUrl.searchParams.get("limit") || "50", 10);
  return {
    page: Math.max(1, page),
    limit: Math.min(100, Math.max(1, limit)),
  };
}

export function paginate<T>(data: T[], page: number, limit: number): PaginatedResponse<T> {
  const total = data.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    data: data.slice(start, end),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Success response - returns data in consistent format
 */
export function apiSuccess<T>(data: T, status = 200, cache?: { maxAge?: number; staleWhileRevalidate?: number }) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (cache) {
    headers["Cache-Control"] = `public, s-maxage=${cache.maxAge ?? 60}, stale-while-revalidate=${cache.staleWhileRevalidate ?? 300}`;
  }

  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status, headers }
  );
}

/**
 * Error response - returns error in consistent format
 * Does NOT expose internal error details to client
 */
export function apiError(message: string, status = 400, internalError?: unknown) {
  // Log internal error for debugging but don't expose to client
  if (internalError) {
    console.error("[API Error]", message, internalError);
  }

  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}

/**
 * Unauthorized error
 */
export function apiUnauthorized(message = "No autorizado") {
  return apiError(message, 401);
}

/**
 * Forbidden error
 */
export function apiForbidden(message = "Acceso denegado") {
  return apiError(message, 403);
}

/**
 * Not found error
 */
export function apiNotFound(message = "Recurso no encontrado") {
  return apiError(message, 404);
}

/**
 * Validation error
 */
export function apiValidationError(message: string) {
  return apiError(message, 422);
}

/**
 * Server error - generic message, logs details internally
 */
export function apiServerError(internalError?: unknown) {
  // Log the actual error for debugging but return generic message to client
  const errorId = Date.now(); // Correlation ID for logging
  console.error(`[API Error ${errorId}]`, internalError);

  return NextResponse.json(
    {
      success: false,
      error: "Error interno del servidor",
      errorId: process.env.NODE_ENV === "development" ? errorId : undefined, // Only expose in dev
    },
    { status: 500 }
  );
}

/**
 * Rate limit error
 */
export function apiRateLimited(message = "Demasiadas solicitudes") {
  return apiError(message, 429);
}

/**
 * Parse and validate request body with Zod schema
 */
export async function parseBody<T>(
  request: NextRequest,
  schema: {
    parse: (data: unknown) => T;
  }
): Promise<{ success: true; data: T } | { success: false; error: NextResponse }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: apiValidationError("Datos inválidos"),
    };
  }
}

/**
 * Get authenticated user from request
 * Returns null if not authenticated
 */
export function getAuthUser(request: NextRequest): { role: string } | null {
  const authCookie = request.cookies.get("activados_auth");

  if (!authCookie?.value) {
    return null;
  }

  try {
    // Parse the auth cookie (JSON format)
    const authData = JSON.parse(authCookie.value);
    if (authData?.role) {
      return { role: authData.role };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Require authentication - returns error response if not authenticated
 */
export function requireAuth(request: NextRequest): { success: true; role: string } | { success: false; error: NextResponse } {
  const user = getAuthUser(request);

  if (!user) {
    return { success: false, error: apiUnauthorized() };
  }

  return { success: true, role: user.role };
}

/**
 * Require admin role
 */
export function requireAdmin(request: NextRequest): { success: true } | { success: false; error: NextResponse } {
  const auth = requireAuth(request);

  if (!auth.success) {
    return auth;
  }

  if (auth.role !== "admin") {
    return { success: false, error: apiForbidden("Se requiere rol de administrador") };
  }

  return { success: true };
}
