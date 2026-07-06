import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { extractErrorMessage } from '../utils/http-error';

/**
 * Central error interceptor: logs every failed request and surfaces a single
 * user-facing toast for *infrastructure* failures the UI otherwise can't explain —
 * network errors (status 0) and server errors (5xx).
 *
 * It deliberately does NOT toast 4xx responses (those are business/validation
 * errors each feature surfaces inline) nor 401 (handled by the auth interceptor's
 * refresh/logout flow), preventing duplicate messages. The original error is
 * always re-thrown so component-level handling still runs.
 */
export const loggingInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const { status, url } = error;
      const message = error.error?.message ?? error.message ?? 'Unknown error';

      if (status === 0) {
        console.error(`[HTTP Error] Network error while requesting ${url}`);
        toast.danger(extractErrorMessage(error));
      } else if (status >= 400 && status < 500) {
        console.warn(`[HTTP Warning] ${status} ${url} - ${message}`);
      } else if (status >= 500 && status < 600) {
        console.error(`[HTTP Error] ${status} ${url} - ${message}`);
        toast.danger(extractErrorMessage(error));
      }

      return throwError(() => error);
    }),
  );
};
