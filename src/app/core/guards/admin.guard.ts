import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Protects admin routes. Denies access and redirects to home
 * if the user is not an Admin.
 */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Require a signed-in, non-expired session with the Admin role. The backend
  // re-checks the role on every admin request — this guard is a UX gate only.
  if (auth.isLoggedIn() && !auth.isTokenExpired() && auth.isAdmin()) {
    return true;
  }

  return router.createUrlTree(['/']);
};
