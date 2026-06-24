import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

/**
 * Application routes.
 *
 * Every page is lazily loaded via `loadComponent` so each feature ships in its
 * own chunk and the initial bundle stays small (Leaflet, for example, only loads
 * with the trip itinerary).
 *
 * Auth policy: `/chat`, `/profile`, and `/my-trips` are protected by the
 * `authGuard`. All other pages are publicly accessible.
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
  {
    path: 'reset-password',
    loadComponent: () => import('./features/auth/reset-password/reset-password').then((m) => m.ResetPasswordPage),
  },
  {
    path: 'confirm-email',
    loadComponent: () => import('./features/auth/confirm-email/confirm-email').then((m) => m.ConfirmEmailPage),
  },
  {
    path: 'google-callback',
    loadComponent: () => import('./features/auth/google-callback/google-callback').then((m) => m.GoogleCallbackPage),
  },
  { path: 'plan', loadComponent: () => import('./features/trip-form/trip-form').then((m) => m.TripFormPage) },
  { path: 'about', loadComponent: () => import('./features/about/about').then((m) => m.AboutPage) },
  { path: 'terms', loadComponent: () => import('./features/legal/terms/terms').then((m) => m.TermsPage) },
  { path: 'privacy', loadComponent: () => import('./features/legal/privacy/privacy').then((m) => m.PrivacyPage) },
  { path: 'chat', loadComponent: () => import('./features/chat/chat').then((m) => m.ChatPage), canActivate: [authGuard] },
  { path: 'profile', loadComponent: () => import('./features/account/profile/profile').then((m) => m.ProfilePage), canActivate: [authGuard] },
  { path: 'settings', loadComponent: () => import('./features/account/settings/settings').then((m) => m.SettingsPage) },
  {
    path: 'subscription',
    loadComponent: () => import('./features/account/subscription/subscription').then((m) => m.SubscriptionPage),
    canActivate: [authGuard],
  },
  {
    path: 'my-trips',
    loadComponent: () => import('./features/my-trips/my-trips-layout').then((m) => m.MyTripsLayout),
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./features/my-trips/my-trips').then((m) => m.MyTripsPage) },
      {
        path: ':id',
        loadComponent: () => import('./features/my-trips/travel-plan/travel-plan').then((m) => m.TravelPlanPage),
      },
    ],
  },

  // --- Redirects & fallback ---
  { path: 'portfolio', redirectTo: 'profile', pathMatch: 'full' },
  { path: '**', redirectTo: '' },
];
