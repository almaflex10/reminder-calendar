import { Component, OnInit, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { errorMessage } from '../core/error-message';

/**
 * Az e-mailben kapott link ide mutat: /verify?token=...
 * Sikeres megerősítés után rögtön be is jelentkeztet, és a naptárra visz.
 */
@Component({
  selector: 'app-verify-page',
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatProgressBarModule],
  template: `
    <main class="auth-page">
      <mat-card class="auth-card" appearance="outlined">
        <div class="brand"><mat-icon>event_available</mat-icon> Teendőnaptár</div>

        @if (error(); as message) {
          <h1>Nem sikerült</h1>
          <p class="form-error">{{ message }}</p>
          <p>Ha már korábban megerősítetted a címed, egyszerűen jelentkezz be. Ha nem, a bejelentkezésnél kérhetsz új linket.</p>
          <a mat-flat-button class="submit full-width" routerLink="/login">Bejelentkezés</a>
        } @else {
          <h1>E-mail megerősítése…</h1>
          <mat-progress-bar mode="indeterminate" />
        }
      </mat-card>
    </main>
  `,
})
export class VerifyPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  /** a ?token= query paraméter (withComponentInputBinding miatt jön ide magától) */
  readonly token = input<string>();

  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const token = this.token();
    if (!token) {
      this.error.set('Hiányzik a megerősítő kód a linkből.');
      return;
    }
    this.auth.verify(token).subscribe({
      next: () => {
        this.snackBar.open('E-mail cím megerősítve. Üdv a Teendőnaptárban!', undefined, { duration: 4000 });
        this.router.navigate(['/calendar'], { replaceUrl: true });
      },
      error: (err) => this.error.set(errorMessage(err, 'A megerősítő link érvénytelen vagy lejárt.')),
    });
  }
}
