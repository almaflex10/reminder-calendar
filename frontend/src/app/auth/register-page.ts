import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { errorMessage } from '../core/error-message';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pw = group.get('password')?.value;
  const confirm = group.get('confirm')?.value;
  return pw && confirm && pw !== confirm ? { mismatch: true } : null;
}

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  template: `
    <main class="auth-page">
      <mat-card class="auth-card" appearance="outlined">
        <div class="brand"><mat-icon>event_available</mat-icon> Teendőnaptár</div>

        @if (sentTo(); as email) {
          <h1>Nézd meg a postafiókod</h1>
          <div class="notice notice-success">
            <p>Elküldtük a megerősítő linket ide: <strong>{{ email }}</strong></p>
            <p>A link 24 óráig érvényes. A megerősítés után tudsz bejelentkezni.</p>
          </div>
          <button mat-button type="button" (click)="resend(email)" [disabled]="resending()">Nem jött meg? Újraküldés</button>
          @if (resendMessage()) {
            <p>{{ resendMessage() }}</p>
          }
          <p class="auth-switch"><a routerLink="/login">Vissza a bejelentkezéshez</a></p>
        } @else {
          <h1>Regisztráció</h1>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline">
              <mat-label>Felhasználónév</mat-label>
              <input matInput formControlName="username" autocomplete="username" />
              <mat-hint>Ezzel fogsz bejelentkezni</mat-hint>
              @if (form.controls.username.hasError('minlength')) {
                <mat-error>Legalább 3 karakter</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>E-mail cím</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="email" />
              @if (form.controls.email.hasError('email')) {
                <mat-error>Érvénytelen e-mail cím</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Jelszó</mat-label>
              <input matInput type="password" formControlName="password" autocomplete="new-password" />
              <mat-hint>Legalább 8 karakter</mat-hint>
              @if (form.controls.password.hasError('minlength')) {
                <mat-error>Legalább 8 karakter</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Jelszó még egyszer</mat-label>
              <input matInput type="password" formControlName="confirm" autocomplete="new-password" />
            </mat-form-field>

            @if (form.hasError('mismatch') && form.controls.confirm.touched) {
              <p class="form-error">A két jelszó nem egyezik.</p>
            }
            @if (error()) {
              <p class="form-error">{{ error() }}</p>
            }

            <button mat-flat-button class="submit" type="submit" [disabled]="loading()">
              {{ loading() ? 'Regisztráció…' : 'Regisztráció' }}
            </button>
          </form>
          <p class="auth-switch">Van már fiókod? <a routerLink="/login">Bejelentkezés</a></p>
        }
      </mat-card>
    </main>
  `,
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder).nonNullable;

  readonly form = this.fb.group(
    {
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
      confirm: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly sentTo = signal<string | null>(null);
  readonly resending = signal(false);
  readonly resendMessage = signal<string | null>(null);

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { username, email, password } = this.form.getRawValue();
    this.loading.set(true);
    this.error.set(null);

    this.auth.register({ username: username.trim(), email: email.trim(), password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.sentTo.set(email.trim());
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(errorMessage(err, 'Nem sikerült a regisztráció.'));
      },
    });
  }

  resend(email: string): void {
    this.resending.set(true);
    this.auth.resendVerification(email).subscribe({
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
