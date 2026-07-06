/**
 * Application route paths, declared once for use in TypeScript navigation
 * (`router.navigate`, guards, interceptors). Template `routerLink`s remain
 * declarative literals.
 */
export const APP_ROUTES = {
  home: '/',
  login: '/login',
  signup: '/signup',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  confirmEmail: '/confirm-email',
  googleCallback: '/google-callback',
  plan: '/plan',
  chat: '/chat',
  profile: '/profile',
  subscription: '/subscription',
  myTrips: '/my-trips',
  tripDetail: (id: string) => `/my-trips/${id}`,
  admin: '/admin',
  about: '/about',
  terms: '/terms',
  privacy: '/privacy',
} as const;
