import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TaskApi } from '../core/api.services';
import { isRecurring, parseIsoDate, repeatLabel, timeRange, today } from '../core/date-utils';
import { errorMessage } from '../core/error-message';
import { TaskDetail } from '../core/models';
import { confirm } from '../shared/confirm-dialog';
import { openTaskDialog } from './task-dialog';

type Filter = 'all' | 'recurring' | 'once';

/** Az összes teendő kezelése: az ismétlődők és az egyszeriek egy helyen. */
@Component({
  selector: 'app-task-list-page',
  imports: [DatePipe, MatButtonModule, MatButtonToggleModule, MatIconModule, MatProgressBarModule, MatTooltipModule],
  template: `
    <div class="page narrow">
      <header class="page-header">
        <h1>Teendők</h1>
        <button mat-flat-button (click)="create()"><mat-icon>add</mat-icon> Új teendő</button>
      </header>

      <mat-button-toggle-group [value]="filter()" (change)="filter.set($event.value)" aria-label="Szűrés" hideSingleSelectionIndicator>
        <mat-button-toggle value="all">Mind ({{ tasks().length }})</mat-button-toggle>
        <mat-button-toggle value="recurring">Ismétlődő ({{ recurringCount() }})</mat-button-toggle>
        <mat-button-toggle value="once">Egyszeri ({{ tasks().length - recurringCount() }})</mat-button-toggle>
      </mat-button-toggle-group>

      <div class="progress-slot">
        @if (loading()) {
          <mat-progress-bar mode="indeterminate" />
        }
      </div>

      @if (visible().length > 0) {
        <ul class="list">
          @for (t of visible(); track t.id) {
            <li class="item" [class.past]="isPast(t)" [style.--cat-color]="t.category?.color ?? 'var(--mat-sys-outline-variant)'">
              <div class="body">
                <span class="title">{{ t.title }}</span>
                <span class="meta">
                  <span class="meta-item">
                    <mat-icon>{{ isRecurring(t) ? 'repeat' : 'event' }}</mat-icon>
                    @if (isRecurring(t)) {
                      {{ repeatLabel(t.repeatIntervalDays, t.repeatWeekdays) }}, {{ t.startDate | date: 'y. MMM d.' }}-tól
                      @if (t.endDate) {
                        {{ t.endDate | date: 'y. MMM d.' }}-ig
                      }
                    } @else {
                      {{ t.startDate | date: 'y. MMM d., EEEE' }}
                    }
                  </span>
                  @if (t.dueTime || t.endTime) {
                    <span class="meta-item"><mat-icon>schedule</mat-icon>{{ timeRange(t.dueTime, t.endTime) }}</span>
                  }
                  @if (t.category) {
                    <span class="meta-item"><span class="color-dot" [style.background]="t.category.color"></span>{{ t.category.name }}</span>
                  }
                </span>
              </div>
              <button mat-icon-button (click)="edit(t)" aria-label="Szerkesztés" matTooltip="Szerkesztés"><mat-icon>edit</mat-icon></button>
              <button mat-icon-button (click)="remove(t)" aria-label="Törlés" matTooltip="Törlés"><mat-icon>delete</mat-icon></button>
            </li>
          }
        </ul>
      } @else if (!loading()) {
        <div class="empty-state">
          <mat-icon>checklist</mat-icon>
          <p>{{ tasks().length === 0 ? 'Még nincs teendőd.' : 'Ebben a szűrésben nincs teendő.' }}</p>
          @if (tasks().length === 0) {
            <button mat-stroked-button (click)="create()">Első teendő hozzáadása</button>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .narrow {
      max-width: 760px;
    }
    .progress-slot {
      height: 4px;
      margin: 12px 0 8px;
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
      gap: 4px;
      padding: 4px 4px 4px 16px;
      border-radius: 12px;
      background: var(--mat-sys-surface-container-low);
      border-left: 4px solid var(--cat-color);
    }
    .item.past {
      opacity: 0.6;
    }
    .body {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 10px 0;
    }
    .title {
      font: var(--mat-sys-body-large);
      overflow-wrap: anywhere;
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 12px;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
    }
    .meta-item {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .meta-item mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
  `,
})
export class TaskListPage implements OnInit {
  private readonly taskApi = inject(TaskApi);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly repeatLabel = repeatLabel;
  protected readonly isRecurring = isRecurring;
  protected readonly timeRange = timeRange;

  readonly tasks = signal<TaskDetail[]>([]);
  readonly loading = signal(false);
  readonly filter = signal<Filter>('all');

  readonly recurringCount = computed(() => this.tasks().filter(isRecurring).length);
  readonly visible = computed(() => {
    const f = this.filter();
    return this.tasks().filter((t) =>
      f === 'all' ? true : f === 'recurring' ? isRecurring(t) : !isRecurring(t),
    );
  });

  ngOnInit(): void {
    this.load();
  }

  /** Lejárt: egyszeri és elmúlt, vagy ismétlődő, aminek már vége. */
  isPast(t: TaskDetail): boolean {
    const last = isRecurring(t) ? t.endDate : t.startDate;
    return last !== null && parseIsoDate(last) < today();
  }

  create(): void {
    openTaskDialog(this.dialog, {})
      .afterClosed()
      .subscribe((r) => r && this.load());
  }

  edit(t: TaskDetail): void {
    openTaskDialog(this.dialog, { task: t })
      .afterClosed()
      .subscribe((r) => r && this.load());
  }

  remove(t: TaskDetail): void {
    const message = isRecurring(t)
      ? `A(z) „${t.title}” minden ismétlődése törlődik, a korábbi pipákkal együtt.`
      : `A(z) „${t.title}” véglegesen törlődik.`;
    confirm(this.dialog, { title: 'Teendő törlése', message }).subscribe((ok) => {
      if (!ok) return;
      this.taskApi.delete(t.id).subscribe({
        next: () => {
          this.tasks.update((list) => list.filter((x) => x.id !== t.id));
          this.snackBar.open('Teendő törölve', undefined, { duration: 3000 });
        },
        error: (err) => this.snackBar.open(errorMessage(err), 'OK', { duration: 5000 }),
      });
    });
  }

  private load(): void {
    this.loading.set(true);
    this.taskApi.all().subscribe({
      next: (list) => {
        this.tasks.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open(errorMessage(err, 'Nem sikerült betölteni a teendőket.'), 'OK', { duration: 5000 });
      },
    });
  }
}
