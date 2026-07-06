import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { APP_ROUTES } from '../../../core/constants/routes';

/**
 * Google OAuth callback handler.
 *
 * After the backend authenticates the user via Google, it redirects back to
 * this frontend route with `accessToken`, `refreshToken`, and optionally
 * `email` as query parameters. This component captures them, persists them
 * to localStorage, updates the auth state, and redirects into the app.
 */
@Component({
  selector: 'app-google-callback',
  standalone: true,
  template: `
    <div class="d-flex align-items-center justify-content-center min-vh-100"
         style="background: #FDFBF7; font-family: 'Plus Jakarta Sans', sans-serif;">
      <div class="text-center">
        <div class="spinner-border mb-3" style="color: #B54304; width: 3rem; height: 3rem;" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="text-muted fs-6">Completing Google sign-in...</p>
        @if (errorMessage) {
          <div class="alert alert-danger mt-3 rounded-3 small">{{ errorMessage }}</div>
        }
      </div>
    </div>
  `,
})
export class GoogleCallbackPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  errorMessage = '';

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;
    const accessToken = params['accessToken'] || params['token'] || '';
    const refreshToken = params['refreshToken'] || '';
    const email = params['email'] || '';

    if (!accessToken) {
      this.errorMessage = 'Google authentication failed. No token received.';
      setTimeout(() => this.router.navigate([APP_ROUTES.login]), 3000);
      return;
    }

    // Persist tokens (and email if the backend supplied it) once.
    this.auth.handleGoogleCallback(accessToken, refreshToken, email || undefined);

    if (email) {
      this.router.navigate([APP_ROUTES.myTrips]);
      return;
    }

    // No email in the query string — resolve it from /me, then continue.
    this.auth.getCurrentUser().subscribe({
      next: (profile) => {
        if (profile?.email) {
          this.auth.setSessionEmail(profile.email);
        }
        this.router.navigate([APP_ROUTES.myTrips]);
      },
      error: () => {
        // Tokens are already saved; proceed regardless.
        this.router.navigate([APP_ROUTES.myTrips]);
      },
    });
  }
}
