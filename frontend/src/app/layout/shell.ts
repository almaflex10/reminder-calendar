import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';

/** A bejelentkezett oldalak kerete: felső sáv navigációval + a tartalom. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule],
  template: `
    <mat-toolbar class="toolbar">
      <a class="brand" routerLink="/calendar">
        <mat-icon>event_available</mat-icon>
        <span class="brand-text">Teendőnaptár</span>
      </a>

      <nav class="nav">
        @for (link of links; track link.path) {
          <a mat-button [routerLink]="link.path" routerLinkActive="active" [attr.aria-label]="link.label">
            <mat-icon>{{ link.icon }}</mat-icon>
            <span class="nav-label">{{ link.label }}</span>
          </a>
        }
      </nav>

      <button mat-icon-button [matMenuTriggerFor]="userMenu" aria-label="Fiók">
        <mat-icon>account_circle</mat-icon>
      </button>
      <mat-menu #userMenu="matMenu" xPosition="before">
        <div class="menu-user">{{ auth.username() }}</div>
        <button mat-menu-item (click)="auth.logout()">
          <mat-icon>logout</mat-icon>
          <span>Kijelentkezés</span>
        </button>
      </mat-menu>
    </mat-toolbar>

    <router-outlet />
  `,
  styles: `
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 10;
      gap: 8px;
      background: var(--mat-sys-surface-container);
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--mat-sys-primary);
      text-decoration: none;
      font: var(--mat-sys-title-medium);
      margin-right: 16px;
    }
    .nav {
      flex: 1;
      display: flex;
      gap: 4px;
    }
    .nav a.active {
      background: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
    }
    .menu-user {
      padding: 8px 16px;
      font: var(--mat-sys-label-large);
      color: var(--mat-sys-on-surface-variant);
    }
    @media (max-width: 640px) {
      .brand-text,
      .nav-label {
        display: none;
      }
      .brand {
        margin-right: 4px;
      }
      .nav a {
        min-width: 0;
        padding: 0 12px;
      }
      .nav a mat-icon {
        margin: 0;
      }
    }
  `,
})
export class Shell {
  protected readonly auth = inject(AuthService);

  protected readonly links = [
    { path: '/calendar', label: 'Naptár', icon: 'calendar_month' },
    { path: '/tasks', label: 'Teendők', icon: 'checklist' },
    { path: '/categories', label: 'Kategóriák', icon: 'label' },
  ];
}
