import { HttpErrorResponse } from '@angular/common/http';

/** A backend hibaüzenetét adja vissza (server.error.include-message: always), vagy egy általános szöveget. */
export function errorMessage(err: unknown, fallback = 'Valami hiba történt. Próbáld újra.'): string {
  if (!(err instanceof HttpErrorResponse)) {
    return fallback;
  }
  if (err.status === 0) {
    return 'A szerver nem érhető el. Fut a backend?';
  }
  const body = err.error;
  if (body && typeof body === 'object') {
    // @Valid hibák: az első mező üzenete
    if (Array.isArray(body.errors) && body.errors[0]?.defaultMessage) {
      return body.errors[0].defaultMessage;
    }
    if (typeof body.message === 'string' && body.message && !body.message.startsWith('Validation failed')) {
      return body.message;
    }
  }
  if (err.status === 400) {
    return 'Hibás adatok. Ellenőrizd a mezőket.';
  }
  return fallback;
}
