import { HttpInterceptorFn } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

/** Hány kérés vár már 3 másodpercnél régebben – ebből tudjuk, hogy a szerver épp ébred. */
@Injectable({ providedIn: 'root' })
export class ServerWakeStatus {
  private readonly slowRequests = signal(0);
  readonly waking = computed(() => this.slowRequests() > 0);

  begin(): void {
    this.slowRequests.update((n) => n + 1);
  }

  end(): void {
    this.slowRequests.update((n) => Math.max(0, n - 1));
  }
}

const SLOW_AFTER_MS = 3000;

/**
 * A Render ingyenes szervere tétlenség után elalszik, és kb. egy perc alatt ébred fel.
 * Ha egy kérés 3 másodpercnél tovább tart, egy sáv jelzi, hogy a szerver ébred – így nem tűnik lefagyottnak.
 */
export const serverWakeInterceptor: HttpInterceptorFn = (req, next) => {
  const status = inject(ServerWakeStatus);
  let counted = false;
  const timer = setTimeout(() => {
    counted = true;
    status.begin();
  }, SLOW_AFTER_MS);

  return next(req).pipe(
    finalize(() => {
      clearTimeout(timer);
      if (counted) status.end();
    }),
  );
};
