export class AppError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(message: string, status = 400, details?: Record<string, unknown>) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = status >= 500 ? "INTERNAL" : status === 409 ? "CONFLICT" : "ERROR";
    this.details = details;
  }
}

export class VersionConflictError extends AppError {
  constructor(currentVersion: number) {
    super("Versión desactualizada", 409, { currentVersion });
    this.code = "VERSION_CONFLICT";
    this.name = "VersionConflictError";
  }
}

export class ValidationError extends AppError {
  constructor(message = "Datos inválidos") {
    super(message, 422);
    this.code = "VALIDATION";
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Recurso no encontrado") {
    super(message, 404);
    this.code = "NOT_FOUND";
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Acceso denegado") {
    super(message, 403);
    this.code = "FORBIDDEN";
    this.name = "ForbiddenError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "No autorizado") {
    super(message, 401);
    this.code = "UNAUTHORIZED";
    this.name = "UnauthorizedError";
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Demasiadas solicitudes") {
    super(message, 429);
    this.code = "RATE_LIMIT";
    this.name = "RateLimitError";
  }
}

export class InternalError extends AppError {
  constructor(message = "Error interno del servidor") {
    super(message, 500);
    this.code = "INTERNAL";
    this.name = "InternalError";
  }
}
