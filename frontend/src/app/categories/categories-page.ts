import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CategoryApi } from '../core/api.services';
import { errorMessage } from '../core/error-message';
import { Category } from '../core/models';
import { confirm } from '../shared/confirm-dialog';
import { openCategoryDialog } from './category-dialog';

@Component({
  selector: 'app-categories-page',
  imports: [MatButtonModule, MatIconModule, MatProgressBarModule, MatTooltipModule],
  template: `
    <div class="page narrow">
      <header class="page-header">
        <h1>Kategóriák</h1>
        <button mat-flat-button (click)="create()"><mat-icon>add</mat-icon> Új kategória</button>
      </header>

      <div class="progress-slot">
        @if (loading()) {
          <mat-progress-bar mode="indeterminate" />
        }
      </div>

      @if (categories().length > 0) {
        <ul class="list">
          @for (c of categories(); track c.id) {
            <li class="item">
              <span class="swatch" [style.background]="c.color"></span>
              <span class="name">{{ c.name }}</span>
              <button mat-icon-button (click)="edit(c)" aria-label="Szerkesztés" matTooltip="Szerkesztés"><mat-icon>edit</mat-icon></button>
              <button mat-icon-button (click)="remove(c)" aria-label="Törlés" matTooltip="Törlés"><mat-icon>delete</mat-icon></button>
            </li>
          }
        </ul>
      } @else if (!loading()) {
        <div class="empty-state">
          <mat-icon>label</mat-icon>
          <p>Még nincs kategóriád. A kategóriákkal színekkel különítheted el a teendőidet, pl. Munka, Otthon, Sport.</p>
          <button mat-stroked-button (click)="create()">Első kategória létrehozása</button>
        </div>
      }
    </div>
  `,
  styles: `
    .narrow {
      max-width: 560px;
    }
    .progress-slot {
      height: 4px;
      margin-bottom: 8px;
    }
    .list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 4px 4px 4px 16px;
      border-radius: 12px;
      background: var(--mat-sys-surface-container-low);
    }
    .swatch {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      flex: none;
    }
    .name {
      flex: 1;
      min-width: 0;
      font: var(--mat-sys-body-large);
      overflow-wrap: anywhere;
    }
  `,
})
export class CategoriesPage implements OnInit {
  private readonly api = inject(CategoryApi);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly categories = signal<Category[]>([]);
  readonly loading = signal(false);

  ngOnInit(): void {
    this.load();
  }

  create(): void {
    openCategoryDialog(this.dialog, null)
      .afterClosed()
      .subscribe((saved) => saved && this.load());
  }

  edit(c: Category): void {
    openCategoryDialog(this.dialog, c)
      .afterClosed()
      .subscribe((saved) => saved && this.load());
  }

  remove(c: Category): void {
    confirm(this.dialog, {
      title: 'Kategória törlése',
      message: `A(z) „${c.name}” kategória törlődik. A hozzá tartozó teendők megmaradnak, csak kategória nélkül.`,
    }).subscribe((ok) => {
      if (!ok) return;
      this.api.delete(c.id).subscribe({
        next: () => {
          this.categories.update((list) => list.filter((x) => x.id !== c.id));
          this.snackBar.open('Kategória törölve', undefined, { duration: 3000 });
        },
        error: (err) => this.snackBar.open(errorMessage(err), 'OK', { duration: 5000 }),
      });
    });
  }

  private load(): void {
    this.loading.set(true);
    this.api.list().subscribe({
      next: (list) => {
        this.categories.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open(errorMessage(err, 'Nem sikerült betölteni a kategóriákat.'), 'OK', { duration: 5000 });
      },
    });
  }
}
