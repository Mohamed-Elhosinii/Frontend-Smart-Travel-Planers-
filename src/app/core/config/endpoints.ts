import { API_BASE_URL } from './api.config';

/**
 * Every backend endpoint the frontend talks to, built from {@link API_BASE_URL}.
 *
 * This is the ONLY place API paths are declared — services and components import
 * from here instead of writing string literals. Paths mirror the .NET routes
 * exactly (routes are case-insensitive, so existing casing is preserved).
 */
export const ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/Auth/login`,
    register: `${API_BASE_URL}/Auth/register`,
    refreshToken: `${API_BASE_URL}/Auth/refresh-token`,
    logout: `${API_BASE_URL}/Auth/logout`,
    forgotPassword: `${API_BASE_URL}/Auth/forgot-password`,
    resetPassword: `${API_BASE_URL}/Auth/reset-password`,
    confirmEmail: `${API_BASE_URL}/Auth/confirm-email`,
    resendConfirmEmail: `${API_BASE_URL}/Auth/resend-confirm-email`,
    me: `${API_BASE_URL}/Auth/me`,
    googleLogin: `${API_BASE_URL}/Auth/google-login`,
  },
  chat: {
    session: `${API_BASE_URL}/Chat/session`,
    send: `${API_BASE_URL}/Chat/send`,
    sessions: `${API_BASE_URL}/Chat/sessions`,
    history: (sessionId: string) => `${API_BASE_URL}/Chat/history/${sessionId}`,
    plan: (tripId: string) => `${API_BASE_URL}/Chat/plan/${tripId}`,
    sessionTrip: `${API_BASE_URL}/Chat/session/trip`,
    sessionLinkTrip: `${API_BASE_URL}/Chat/session/link-trip`,
  },
  trip: {
    base: `${API_BASE_URL}/Trip`,
    quickPlan: `${API_BASE_URL}/Trip/quick-plan`,
    suggestions: (tripId: string) => `${API_BASE_URL}/Trip/${tripId}/suggestions`,
  },
  places: {
    resolve: `${API_BASE_URL}/places/resolve`,
    confirm: `${API_BASE_URL}/places/confirm`,
  },
  hotels: {
    bookingLinks: (hotelName: string) =>
      `${API_BASE_URL}/hotels/${encodeURIComponent(hotelName)}/booking-links`,
  },
  subscription: {
    plans: `${API_BASE_URL}/subscription/plans`,
    mySubscription: `${API_BASE_URL}/subscription/my-subscription`,
    subscribe: `${API_BASE_URL}/subscription/subscribe`,
    cancel: `${API_BASE_URL}/subscription/cancel`,
  },
  admin: {
    statsOverview: `${API_BASE_URL}/admin/stats/overview`,
    users: `${API_BASE_URL}/admin/users`,
    userPlan: (userId: string) => `${API_BASE_URL}/admin/users/${userId}/plan`,
    userToggleStatus: (userId: string) => `${API_BASE_URL}/admin/users/${userId}/toggle-status`,
    plans: `${API_BASE_URL}/admin/plans`,
    plan: (id: string) => `${API_BASE_URL}/admin/plans/${id}`,
    payments: `${API_BASE_URL}/admin/payments`,
  },
} as const;

/**
 * Auth paths that must NOT receive a Bearer token (and are excluded from the
 * 401 refresh-retry). Relative substrings so `url.includes(...)` matches in both
 * dev (relative) and prod (absolute) URLs.
 */
export const PUBLIC_API_PATHS = [
  '/Auth/login',
  '/Auth/register',
  '/Auth/forgot-password',
  '/Auth/reset-password',
  '/Auth/confirm-email',
  '/Auth/resend-confirm-email',
  '/Auth/refresh-token',
  '/Auth/google',
] as const;
