import { Routes } from '@angular/router';

/**
 * Application routes.
 *
 * Every page is lazily loaded via `loadComponent` so each feature ships in its
 * own chunk and the initial bundle stays small (Leaflet, for example, only loads
 * with the trip itinerary).
 *
 * Auth policy: all pages are publicly browsable. Authentication is enforced only
 * at the point of *saving a plan* (see ChatPage.savePlan), not via route guards.
 * The reusable `authGuard` (core/guards/auth-guard.ts) remains available if any
 * route needs protecting again later.
 */
export const routes: Routes = [
  // --- Public pages ---
  { path: '', loadComponent: () => import('./features/landing/landing').then((m) => m.LandingPage) },
  { path: 'login', loadComponent: () => import('./features/auth/login/login').then((m) => m.LoginPage) },
  { path: 'signup', loadComponent: () => import('./features/auth/signup/signup').then((m) => m.SignupPage) },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password').then((m) => m.ForgotPasswordPage),
  },
  { path: 'plan', loadComponent: () => import('./features/trip-form/trip-form').then((m) => m.TripFormPage) },
  { path: 'about', loadComponent: () => import('./features/about/about').then((m) => m.AboutPage) },
  { path: 'terms', loadComponent: () => import('./features/legal/terms/terms').then((m) => m.TermsPage) },
  { path: 'privacy', loadComponent: () => import('./features/legal/privacy/privacy').then((m) => m.PrivacyPage) },
  { path: 'chat', loadComponent: () => import('./features/chat/chat').then((m) => m.ChatPage) },
  { path: 'profile', loadComponent: () => import('./features/account/profile/profile').then((m) => m.ProfilePage) },
  { path: 'settings', loadComponent: () => import('./features/account/settings/settings').then((m) => m.SettingsPage) },
  {
    path: 'my-trips',
    loadComponent: () => import('./features/my-trips/my-trips-layout').then((m) => m.MyTripsLayout),
    children: [
      { path: '', loadComponent: () => import('./features/my-trips/my-trips').then((m) => m.MyTripsPage) },
      {
        path: 'plan/:id',
        loadComponent: () => import('./features/my-trips/travel-plan/travel-plan').then((m) => m.TravelPlanPage),
      },
    ],
  },

  // --- Redirects & fallback ---
  { path: 'portfolio', redirectTo: 'profile', pathMatch: 'full' },
  { path: '**', redirectTo: '' },
];
