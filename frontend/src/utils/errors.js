import { ApiError } from '../api/client';

/**
 * Extracts a safe, user-friendly error message from any caught error.
 * Prevents technical stack traces from bleeding into the UI.
 */
export function getErrorMessage(err, fallback = 'An unexpected error occurred.') {
  if (err instanceof ApiError) {
    return err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === 'string') {
    return err;
  }
  return fallback;
}