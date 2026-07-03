import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const loggingInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const { status, url } = error;
      const message = error.error?.message ?? error.message ?? 'Unknown error';

      if (status === 0) {
        console.error(`[HTTP Error] Network error while requesting ${url}`);
      } else if (status >= 400 && status < 500) {
        console.warn(`[HTTP Warning] ${status} ${url} - ${message}`);
      } else if (status >= 500 && status < 600) {
        console.error(`[HTTP Error] ${status} ${url} - ${message}`);
      }

      return throwError(() => error);
    }),
  );
};
