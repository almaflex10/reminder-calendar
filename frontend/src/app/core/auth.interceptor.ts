import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Minden /api kéréshez hozzáteszi a JWT tokent.
 * Ha a backend 401-et ad (lejárt vagy érvénytelen token), kijelentkeztet.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();
  const isAuthCall = req.url.startsWith('/api/auth/');

  const request =
    token && !isAuthCall ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && token && !isAuthCall) {
        auth.logout(true);
      }
      return throwError(() => err);
    }),
  );
};
