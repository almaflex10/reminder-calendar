import { Component, inject } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ServerWakeStatus } from './core/server-wake';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatProgressSpinnerModule],
  template: `
    @if (wake.waking()) {
      <div class="wake-banner" role="status">
        <mat-spinner diameter="18" strokeWidth="2" />
        A szerver ébred, ez akár egy percig is tarthat…
      </div>
    }
    <router-outlet />
  `,
  styles: `
    .wake-banner {
      position: fixed;
      left: 50%;
      bottom: 24px;
      transform: translateX(-50%);
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 12px;
      max-width: calc(100vw - 32px);
      padding: 12px 20px;
      border-radius: 12px;
      background: var(--mat-sys-inverse-surface);
      color: var(--mat-sys-inverse-on-surface);
      font: var(--mat-sys-body-medium);
      box-shadow: var(--mat-sys-level3);
      --mat-progress-spinner-active-indicator-color: var(--mat-sys-inverse-primary);
    }
  `,
})
export class App {
  protected readonly wake = inject(ServerWakeStatus);

  constructor() {
    // Ha a telepített (főképernyős) app új verziót talál, felajánljuk a frissítést.
    const updates = inject(SwUpdate);
    const snackBar = inject(MatSnackBar);
    if (updates.isEnabled) {
      updates.versionUpdates
        .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
        .subscribe(() =>
          snackBar
            .open('Elérhető az alkalmazás új verziója.', 'Frissítés')
            .onAction()
            .subscribe(() => document.location.reload()),
        );
    }
  }
}
