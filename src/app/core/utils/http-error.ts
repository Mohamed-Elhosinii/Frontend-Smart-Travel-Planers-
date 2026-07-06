import { HttpErrorResponse } from '@angular/common/http';

/**
 * Turns any HTTP failure into a single user-friendly message while preserving
 * meaningful backend text where possible.
 *
 * The backend wraps responses in an `ApiResponse` envelope
 * (`{ succeeded, message, errors[] }`, camelCase over the wire), and returns a
 * `{ message: 'Validation failed', errors: [...] }` shape for model-validation
 * failures. This helper unwraps that first, then falls back to status-based
 * messages for network / 401 / 403 / 404 / 500 cases.
 */
export function extractErrorMessage(
  err: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (!(err instanceof HttpErrorResponse)) {
    return fallback;
  }

  // Status 0 → request never reached the server (offline, CORS, DNS…).
  if (err.status === 0) {
    return 'Network error — please check your connection and try again.';
  }

  let data: unknown = err.error;
  if (typeof data === 'string') {
    const raw = data;
    try {
      data = JSON.parse(raw);
    } catch {
      // A plain-text error body is itself the message.
      if (raw.trim()) return raw;
    }
  }

  const body = data as { message?: string; errors?: unknown } | null;

  // ApiResponse.Failure → { errors: [...] }; the primary source of truth.
  if (body && Array.isArray(body.errors) && body.errors.length > 0) {
    return body.errors.filter((e) => typeof e === 'string' && e.trim()).join(' ');
  }
  if (body?.message && typeof body.message === 'string') {
    return body.message;
  }

  switch (err.status) {
    case 400:
      return 'The request was invalid. Please review your details and try again.';
    case 401:
      return 'Your session has expired. Please sign in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource could not be found.';
    case 429:
      return 'Too many attempts. Please wait a moment and try again.';
    case 500:
    case 502:
    case 503:
      return 'A server error occurred. Please try again in a moment.';
    default:
      return err.message || fallback;
  }
}
