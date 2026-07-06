/**
 * Reusable user-facing strings shared across features. Status/network error
 * wording lives in `utils/http-error.ts`; this holds the higher-level fallbacks
 * that were previously duplicated inline.
 */
export const MESSAGES = {
  genericError: 'Something went wrong. Please try again.',
  tripCreateFailed: 'Could not create the trip. Please try again.',
  loginFailed: 'We could not sign you in. Please try again.',
  registrationFailed: 'Registration failed. Please try again.',
  destinationNotFound: 'Destination not found. Please try another city.',
  destinationResolveFailed: 'Failed to resolve destination. Check your connection.',
  resetSuccess: 'If this email exists, a reset code has been sent.',
} as const;
