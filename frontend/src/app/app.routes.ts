import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guards';
import { Shell } from './layout/shell';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'Bejelentkezés · Teendőnaptár',
    loadComponent: () => import('./auth/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    title: 'Regisztráció · Teendőnaptár',
    loadComponent: () => import('./auth/register-page').then((m) => m.RegisterPage),
  },
  {
    // ide mutat a megerősítő e-mailben kapott link
    path: 'verify',
    title: 'E-mail megerősítése · Teendőnaptár',
    loadComponent: () => import('./auth/verify-page').then((m) => m.VerifyPage),
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'calendar' },
      {
        path: 'calendar',
        title: 'Naptár · Teendőnaptár',
        loadComponent: () => import('./calendar/calendar-page').then((m) => m.CalendarPage),
      },
      {
        path: 'tasks',
        title: 'Teendők · Teendőnaptár',
        loadComponent: () => import('./tasks/task-list-page').then((m) => m.TaskListPage),
      },
      {
        path: 'categories',
        title: 'Kategóriák · Teendőnaptár',
        loadComponent: () => import('./categories/categories-page').then((m) => m.CategoriesPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
