import { Component, OnInit, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { errorMessage } from '../core/error-message';

/** Az e-mailben kapott link ide mutat: /verify?token=... */
@Component({
  selector: 'app-verify-page',
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatProgressBarModule],
  template: `
    <main class="auth-page">
      <mat-card class="auth-card" appearance="outlined">
        <div class="brand"><mat-icon>event_available</mat-icon> Teendőnaptár</div>

        @switch (state()) {
          @case ('loading') {
            <h1>E-mail megerősítése…</h1>
            <mat-progress-bar mode="indeterminate" />
          }
          @case ('success') {
            <h1>Kész!</h1>
            <div class="notice notice-success"><p>{{ message() }}</p></div>
            <a mat-flat-button class="submit full-width" routerLink="/login">Bejelentkezés</a>
          }
          @case ('error') {
            <h1>Nem sikerült</h1>
            <p class="form-error">{{ message() }}</p>
            <p>Jelentkezz be, és ha a fiók még nincs megerősítve, ott kérhetsz új linket.</p>
            <a mat-flat-button class="submit full-width" routerLink="/login">Bejelentkezés</a>
          }
        }
      </mat-card>
    </main>
  `,
})
export class VerifyPage implements OnInit {
  private readonly auth = inject(AuthService);

  /** a ?token= query paraméter (withComponentInputBinding miatt jön ide magától) */
  readonly token = input<string>();

  readonly state = signal<'loading' | 'success' | 'error'>('loading');
  readonly message = signal('');

  ngOnInit(): void {
    const token = this.token();
    if (!token) {
      this.state.set('error');
      this.message.set('Hiányzik a megerősítő kód a linkből.');
      return;
    }
    this.auth.verify(token).subscribe({
      next: (res) => {
        this.message.set(res.message);
        this.state.set('success');
      },
      error: (err) => {
        this.message.set(errorMessage(err, 'A megerősítő link érvénytelen vagy lejárt.'));
        this.state.set('error');
      },
    });
  }
}
