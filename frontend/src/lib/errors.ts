import type { AxiosError } from "axios";

/**
 * Normalised app-level error. All service methods surface this shape so
 * UI code has a single, predictable API for showing error messages.
 */
export class AppError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(message: string, opts: { status?: number; code?: string; details?: unknown } = {}) {
    super(message);
    this.name = "AppError";
    this.status = opts.status ?? 0;
    this.code = opts.code ?? "unknown_error";
    this.details = opts.details;
  }
}

/** Convert an axios error / raw error / string into a friendly AppError. */
export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  const ax = err as AxiosError<{ detail?: unknown }>;
  if (ax?.isAxiosError) {
    const status = ax.response?.status ?? 0;
    const detail = ax.response?.data?.detail;
    return new AppError(formatDetail(detail) ?? ax.message ?? "Something went wrong", {
      status,
      code: mapStatusToCode(status),
      details: detail,
    });
  }
  if (err instanceof Error) return new AppError(err.message);
  return new AppError("Something went wrong.");
}

/** Extract a human-readable string from FastAPI's `detail` field. */
export function formatDetail(detail: unknown): string | null {
  if (detail == null) return null;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((e) => (e && typeof (e as { msg?: string }).msg === "string" ? (e as { msg: string }).msg : JSON.stringify(e)))
      .join(" ");
  }
  if (typeof detail === "object" && detail !== null && "msg" in detail) {
    return String((detail as { msg?: string }).msg ?? "");
  }
  return String(detail);
}

function mapStatusToCode(status: number): string {
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "server_error";
  if (status >= 400) return "bad_request";
  return "network_error";
}
