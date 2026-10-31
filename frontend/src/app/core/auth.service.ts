import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { AuthResponse, MessageResponse, RegisterRequest } from './models';

interface Session {
  token: string;
  username: string;
  /** Lejárat ezredmásodpercben (Date.now() szerint). */
  expiresAt: number;
}

const STORAGE_KEY = 'reminder.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly session = signal<Session | null>(loadSession());

  readonly isLoggedIn = computed(() => this.session() !== null);
  readonly username = computed(() => this.session()?.username ?? null);
  readonly token = computed(() => this.session()?.token ?? null);

  login(username: string, password: string): Observable<void> {
    return this.http.post<AuthResponse>('/api/auth/login', { username, password }).pipe(
      tap((res) => this.startSession(res)),
      map(() => undefined),
    );
  }

  register(req: RegisterRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>('/api/auth/register', req);
  }

  /** Megerősíti az e-mail címet, és egyben be is jelentkeztet. */
  verify(token: string): Observable<void> {
    return this.http.get<AuthResponse>('/api/auth/verify', { params: { token } }).pipe(
      tap((res) => this.startSession(res)),
      map(() => undefined),
    );
  }

  resendVerification(email: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>('/api/auth/resend-verification', { email });
  }

  private startSession(res: AuthResponse): void {
    const session: Session = {
      token: res.token,
      username: res.username,
      expiresAt: Date.now() + res.expiresInSeconds * 1000,
    };
    saveSession(session);
    this.session.set(session);
  }

  /** @param expired true, ha a token lejárt (az interceptor hívja 401-nél) */
  logout(expired = false): void {
    saveSession(null);
    this.session.set(null);
    this.router.navigate(['/login'], expired ? { queryParams: { expired: 1 } } : {});
  }
}

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    return s.expiresAt > Date.now() ? s : null;
  } catch {
    return null;
  }
}

function saveSession(s: Session | null): void {
  try {
    if (s) localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // privát böngészőablakban a localStorage hibát dobhat – ilyenkor csak a memóriában marad
  }
}
