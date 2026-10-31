import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

/**
 * Az "/api/..." kérések elé odateszi a backend címét (environment.apiUrl).
 * Élesben így közvetlenül a Renderen futó backendet hívja; fejlesztésben üres, ott a proxy dolgozik.
 */
export const apiBaseInterceptor: HttpInterceptorFn = (req, next) => {
  if (environment.apiUrl && req.url.startsWith('/api/')) {
    return next(req.clone({ url: environment.apiUrl + req.url }));
  }
  return next(req);
};
