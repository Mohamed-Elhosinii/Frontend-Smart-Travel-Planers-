import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

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
      setTimeout(() => this.router.navigate(['/login']), 3000);
      return;
    }

    this.auth.handleGoogleCallback(accessToken, refreshToken, email);

    // If we don't have the email from query params, fetch it from /me
    if (!email) {
      this.auth.getCurrentUser().subscribe({
        next: (profile) => {
          if (profile?.email) {
            // Update the session email from the profile
            this.auth.handleGoogleCallback(accessToken, refreshToken, profile.email);
          }
          this.router.navigate(['/my-trips']);
        },
        error: () => {
          // Token is saved, navigate anyway
          this.router.navigate(['/my-trips']);
        },
      });
    } else {
      this.router.navigate(['/my-trips']);
    }
  }
}
