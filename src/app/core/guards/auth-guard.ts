import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Protects authenticated routes. Logged-out users are redirected to `/login`
 * with a `returnUrl` so they land back where they intended after signing in.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // A valid, unexpired access token grants access immediately.
  if (auth.getToken() && !auth.isTokenExpired()) {
    return true;
  }
  // Access token missing/expired but a refresh token exists: allow — the HTTP
  // interceptor transparently refreshes on the first request (and logs out if
  // that fails). This avoids bouncing users with a merely-stale access token.
  if (auth.getRefreshToken()) {
    return true;
  }
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
