import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** Paths that should NOT receive the Authorization header. */
const PUBLIC_PATHS = ['/api/Auth/login', '/api/Auth/register', '/api/Auth/forgot-password', '/api/Auth/reset-password', '/api/Auth/confirm-email'];

/** Tracks whether a token refresh is already in flight to prevent loops. */
let isRefreshing = false;

/**
 * Functional HTTP interceptor that:
 * 1. Attaches the Bearer token to every outgoing API request (except public auth routes).
 * 2. Intercepts 401 responses and attempts a transparent token refresh via
 *    POST /api/Auth/refresh-token. If the refresh succeeds, the original
 *    request is retried with the new token. If it fails, the user is logged
 *    out and redirected to /login.
 */
export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Skip token injection for public auth endpoints
  const isPublic = PUBLIC_PATHS.some(path => req.url.includes(path));

  let authorizedReq = req;
  if (!isPublic) {
    const token = auth.getToken();
    if (token && token.trim() !== '') {
      authorizedReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token.trim()}` },
      });
    }
  }

  return next(authorizedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Only attempt refresh on 401 and not on public routes
      if (error.status === 401 && !isPublic && !isRefreshing) {
        isRefreshing = true;

        return auth.refreshAccessToken().pipe(
          switchMap(success => {
            isRefreshing = false;

            if (success) {
              // Retry the original request with the fresh token
              const newToken = auth.getToken();
              const retryReq = req.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` },
              });
              return next(retryReq);
            }

            // Refresh failed — force logout
            auth.logout();
            return throwError(() => error);
          }),
          catchError(refreshError => {
            isRefreshing = false;
            auth.logout();
            return throwError(() => refreshError);
          }),
        );
      }

      return throwError(() => error);
    }),
  );
};
