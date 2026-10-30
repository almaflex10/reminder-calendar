import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { errorMessage } from '../core/error-message';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  template: `
    <main class="auth-page">
      <mat-card class="auth-card" appearance="outlined">
        <div class="brand"><mat-icon>event_available</mat-icon> Teendőnaptár</div>
        <h1>Bejelentkezés</h1>

        @if (expired()) {
          <div class="notice"><p>Lejárt a munkameneted, jelentkezz be újra.</p></div>
        }

        <form [formGroup]="form" (ngSubmit)="submit()">
          <mat-form-field appearance="outline">
            <mat-label>Felhasználónév</mat-label>
            <input matInput formControlName="username" autocomplete="username" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Jelszó</mat-label>
            <input matInput [type]="hidePassword() ? 'password' : 'text'" formControlName="password" autocomplete="current-password" />
            <button mat-icon-button matSuffix type="button" (click)="hidePassword.set(!hidePassword())"
                    [attr.aria-label]="hidePassword() ? 'Jelszó megjelenítése' : 'Jelszó elrejtése'">
              <mat-icon>{{ hidePassword() ? 'visibility' : 'visibility_off' }}</mat-icon>
            </button>
          </mat-form-field>

          @if (error()) {
            <p class="form-error">{{ error() }}</p>
          }

          <button mat-flat-button class="submit" type="submit" [disabled]="loading()">
            {{ loading() ? 'Bejelentkezés…' : 'Bejelentkezés' }}
          </button>
        </form>

        @if (notVerified()) {
          <div class="notice" style="margin-top: 16px">
            <p>Az e-mail címed még nincs megerősítve. Nézd meg a postafiókod, vagy kérj új linket:</p>
            <form [formGroup]="resendForm" (ngSubmit)="resend()">
              <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
                <mat-label>E-mail cím</mat-label>
                <input matInput type="email" formControlName="email" autocomplete="email" />
              </mat-form-field>
              <button mat-button type="submit" [disabled]="resendForm.invalid || resending()">Megerősítő e-mail újraküldése</button>
            </form>
            @if (resendMessage()) {
              <p style="margin-top: 8px">{{ resendMessage() }}</p>
            }
          </div>
        }

        <p class="auth-switch">Még nincs fiókod? <a routerLink="/register">Regisztráció</a></p>
      </mat-card>
    </main>
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder).nonNullable;

  /** ?expired=1 – az interceptor ezzel küld ide, ha lejárt a token */
  readonly expiredParam = input<string | undefined>(undefined, { alias: 'expired' });
  readonly expired = computed(() => !!this.expiredParam());

  readonly form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });
  readonly resendForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly hidePassword = signal(true);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly notVerified = signal(false);
  readonly resending = signal(false);
  readonly resendMessage = signal<string | null>(null);

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { username, password } = this.form.getRawValue();
    this.loading.set(true);
    this.error.set(null);
    this.notVerified.set(false);

    this.auth.login(username.trim(), password).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.status === 403) {
          // jó a jelszó, de nincs megerősítve az e-mail
          this.notVerified.set(true);
        } else {
          this.error.set(errorMessage(err, 'Nem sikerült bejelentkezni.'));
        }
      },
    });
  }

  resend(): void {
    this.resending.set(true);
    this.auth.resendVerification(this.resendForm.getRawValue().email.trim()).subscribe({
      next: (res) => {
        this.resending.set(false);
        this.resendMessage.set(res.message);
      },
      error: (err) => {
        this.resending.set(false);
        this.resendMessage.set(errorMessage(err));
      },
    });
  }
}
