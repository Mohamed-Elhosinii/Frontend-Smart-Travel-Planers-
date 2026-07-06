import {
  HttpContextToken,
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, map, Observable, shareReplay, switchMap, take, throwError } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { PUBLIC_API_PATHS } from '../config/endpoints';

/**
 * Marks a request that has already been retried after a token refresh, so a
 * second 401 on the same request does NOT trigger another refresh (prevents an
 * infinite refresh→retry→401 loop when the refreshed token is still rejected).
 */
const ALREADY_RETRIED = new HttpContextToken<boolean>(() => false);

/**
 * A single in-flight refresh shared by every request that hits a 401 while it
 * runs. The first 401 starts the refresh; concurrent 401s subscribe to the same
 * stream (via `shareReplay`) and retry once the new token is available — instead
 * of each firing its own refresh or being dropped. Reset in `finalize` so a
 * later expiry can refresh again.
 */
let refresh$: Observable<string | null> | null = null;

function withToken(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  const trimmed = token?.trim();
  return trimmed
    ? req.clone({ setHeaders: { Authorization: `Bearer ${trimmed}` } })
    : req;
}

/**
 * Functional HTTP interceptor that:
 * 1. Attaches the Bearer token to every outgoing API request (except public auth routes).
 * 2. On a 401, transparently refreshes the token once (shared across concurrent
 *    requests) and retries the original request. If the refresh fails, the user
 *    is logged out.
 */
export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const auth = inject(AuthService);
  const isPublic = PUBLIC_API_PATHS.some((path) => req.url.includes(path));

  const outgoing = isPublic ? req : withToken(req, auth.getToken());

  return next(outgoing).pipe(
    catchError((error: HttpErrorResponse) => {
      const alreadyRetried = req.context.get(ALREADY_RETRIED);
      if (error.status !== 401 || isPublic || alreadyRetried) {
        return throwError(() => error);
      }

      // Start (or join) the single shared refresh.
      if (!refresh$) {
        refresh$ = auth.refreshAccessToken().pipe(
          map((success) => {
            if (!success) {
              auth.logout();
              throw error;
            }
            return auth.getToken();
          }),
          finalize(() => {
            refresh$ = null;
          }),
          shareReplay(1),
        );
      }

      return refresh$.pipe(
        take(1),
        switchMap((newToken) => {
          const retried = req.clone({ context: req.context.set(ALREADY_RETRIED, true) });
          return next(withToken(retried, newToken));
        }),
        catchError(() => throwError(() => error)),
      );
    }),
  );
};
