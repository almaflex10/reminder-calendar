import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { startWith } from 'rxjs';
import { CategoryApi, TaskApi } from '../core/api.services';
import { errorMessage } from '../core/error-message';
import { Category, TaskDetail, TaskRequest } from '../core/models';
import { confirm } from '../shared/confirm-dialog';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import {
  DAY_NAMES_SHORT, WEEKDAYS_MASK, WEEKEND_MASK, daysToMask, isRecurring, maskToDays,
  parseIsoDate, shortTime, toIsoDate, today,
} from '../core/date-utils';

export interface TaskDialogData {
  /** Szerkesztésnél a teendő; új teendőnél üres. */
  task?: TaskDetail;
  /** Új teendőnél az előre kitöltött nap (pl. a naptárban kiválasztott). */
  date?: string;
}

/** Mit csinált a párbeszédablak – ebből tudja a hívó, hogy frissítenie kell. */
export type TaskDialogResult = 'saved' | 'deleted' | undefined;

type RepeatMode = 'once' | '1' | '2' | 'custom' | 'weekdays' | 'weekend' | 'days';

@Component({
  selector: 'app-task-dialog',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonToggleModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Teendő szerkesztése' : 'Új teendő' }}</h2>

    <mat-dialog-content>
      <form id="task-form" [formGroup]="form" (ngSubmit)="save()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Mit kell csinálni?</mat-label>
          <input matInput formControlName="title" maxlength="200" cdkFocusInitial />
          @if (form.controls.title.hasError('required')) {
            <mat-error>Add meg a teendő nevét</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Kategória</mat-label>
          <mat-select formControlName="categoryId">
            <mat-option [value]="null">Nincs kategória</mat-option>
            @for (c of categories(); track c.id) {
              <mat-option [value]="c.id">
                <span class="color-dot" [style.background]="c.color"></span>&nbsp; {{ c.name }}
              </mat-option>
            }
          </mat-select>
          @if (categories().length === 0) {
            <mat-hint>Még nincs kategóriád. <a routerLink="/categories" mat-dialog-close>Létrehozás</a></mat-hint>
          }
        </mat-form-field>

        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Ismétlődés</mat-label>
            <mat-select formControlName="repeat">
              <mat-option value="once">Egyszeri</mat-option>
              <mat-option value="1">Naponta</mat-option>
              <mat-option value="2">Kétnaponta</mat-option>
              <mat-option value="custom">Egyéni (pl. 3 naponta)…</mat-option>
              <mat-option value="weekdays">Hétköznap (H–P)</mat-option>
              <mat-option value="weekend">Hétvégén (Szo–V)</mat-option>
              <mat-option value="days">A hét adott napjain…</mat-option>
            </mat-select>
          </mat-form-field>

          @if (repeat() === 'custom') {
            <mat-form-field appearance="outline">
              <mat-label>Hány naponta?</mat-label>
              <input matInput type="number" formControlName="customDays" min="1" max="365" />
              <span matTextSuffix>naponta</span>
              @if (form.controls.customDays.invalid) {
                <mat-error>1 és 365 között</mat-error>
              }
            </mat-form-field>
          }
        </div>
        @if (repeat() === 'days') {
          <div class="weekday-picker">
            <mat-button-toggle-group multiple formControlName="days" aria-label="A hét napjai"
                                     hideMultipleSelectionIndicator (change)="daysError.set(false)">
              @for (name of dayNames; track $index) {
                <mat-button-toggle [value]="$index">{{ name }}</mat-button-toggle>
              }
            </mat-button-toggle-group>
            @if (daysError()) {
              <p class="form-error">Válassz ki legalább egy napot.</p>
            }
          </div>
        }
        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>{{ isRecurring() ? 'Első nap' : 'Nap' }}</mat-label>
            <input matInput [matDatepicker]="startPicker" formControlName="startDate" />
            <mat-datepicker-toggle matIconSuffix [for]="startPicker" />
            <mat-datepicker #startPicker />
            @if (form.controls.startDate.invalid) {
              <mat-error>Adj meg egy dátumot</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Időpont (nem kötelező)</mat-label>
            <input matInput type="time" formControlName="dueTime" />
          </mat-form-field>
        </div>

        @if (isRecurring()) {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Ismétlés vége (nem kötelező)</mat-label>
            <input matInput [matDatepicker]="endPicker" formControlName="endDate" [min]="form.controls.startDate.value" />
            <mat-datepicker-toggle matIconSuffix [for]="endPicker" />
            <mat-datepicker #endPicker />
            <mat-hint>Ha üres, a végtelenségig ismétlődik</mat-hint>
          </mat-form-field>
        }

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Megjegyzés (nem kötelező)</mat-label>
          <textarea matInput formControlName="description" rows="2" cdkTextareaAutosize></textarea>
        </mat-form-field>

        @if (error()) {
          <p class="form-error">{{ error() }}</p>
        }
      </form>
    </mat-dialog-content>

    <mat-dialog-actions>
      @if (isEdit) {
        <button mat-button class="delete" type="button" (click)="remove()" [disabled]="saving()">
          <mat-icon>delete</mat-icon> Törlés
        </button>
      }
      <span class="spacer"></span>
      <button mat-button mat-dialog-close type="button">Mégse</button>
      <button mat-flat-button type="submit" form="task-form" [disabled]="saving()">Mentés</button>
    </mat-dialog-actions>
  `,
  styles: `
    form {
      padding-top: 8px;
    }
    mat-form-field {
      margin-bottom: 12px;
    }
    .row {
      display: flex;
      gap: 12px;
    }
    .row > mat-form-field {
      flex: 1;
      min-width: 0;
    }
    .spacer {
      flex: 1;
    }
    .delete {
      color: var(--mat-sys-error);
    }
    @media (max-width: 480px) {
      .row {
        flex-direction: column;
        gap: 0;
      }
    }
    .weekday-picker { margin: -4px 0 16px; }
    .weekday-picker mat-button-toggle-group { width: 100%; }
    .weekday-picker mat-button-toggle { flex: 1; }
  `,
})
export class TaskDialog implements OnInit {
  private readonly data = inject<TaskDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject<MatDialogRef<TaskDialog, TaskDialogResult>>(MatDialogRef);
  private readonly dialog = inject(MatDialog);
  private readonly taskApi = inject(TaskApi);
  private readonly categoryApi = inject(CategoryApi);
  private readonly fb = inject(FormBuilder);

  readonly isEdit = !!this.data.task;
  readonly categories = signal<Category[]>([]);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.group({
    title: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(200)]),
    categoryId: this.fb.control<number | null>(null),
    repeat: this.fb.nonNullable.control<RepeatMode>('once'),
    customDays: this.fb.nonNullable.control(3, [Validators.required, Validators.min(1), Validators.max(365)]),
    days: this.fb.nonNullable.control<number[]>([]),
    startDate: this.fb.control<Date | null>(null, Validators.required),
    dueTime: this.fb.nonNullable.control(''),
    endDate: this.fb.control<Date | null>(null),
    description: this.fb.nonNullable.control(''),
  });

  readonly repeat = toSignal(this.form.controls.repeat.valueChanges.pipe(startWith(this.form.controls.repeat.value)), {
    requireSync: true,
  });
  readonly isRecurring = computed(() => this.repeat() !== 'once');
  readonly dayNames = DAY_NAMES_SHORT;
  readonly daysError = signal(false);

  ngOnInit(): void {
    this.categoryApi.list().subscribe((list) => this.categories.set(list));

    const t = this.data.task;
    if (t) {
      const days = t.repeatIntervalDays;
      const mask = t.repeatWeekdays;
      this.form.setValue({
        title: t.title,
        categoryId: t.category?.id ?? null,
        repeat: days === null ? 'once' : days === 1 ? '1' : days === 2 ? '2' : 'custom',
        customDays: days !== null && days > 2 ? days : 3,
        days: mask !== null ? maskToDays(mask) : [],
        startDate: parseIsoDate(t.startDate),
        dueTime: shortTime(t.dueTime) ?? '',
        endDate: t.endDate ? parseIsoDate(t.endDate) : null,
        description: t.description ?? '',
      });
    } else {
      this.form.controls.startDate.setValue(this.data.date ? parseIsoDate(this.data.date) : today());
    }
  }

  save(): void {
    const v = this.form.getRawValue();
    // az egyéni napszám csak akkor számít, ha az "Egyéni" van kiválasztva
    const invalid = this.form.controls.title.invalid || this.form.controls.startDate.invalid ||
      (v.repeat === 'custom' && this.form.controls.customDays.invalid);
    if (invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.daysError.set(v.repeat === 'days' && v.days.length === 0);
    if (invalid || this.daysError()) {
      this.form.markAllAsTouched();
      return;
    }

    const repeatIntervalDays =
      v.repeat === '1' || v.repeat === '2' ? Number(v.repeat) : v.repeat === 'custom' ? v.customDays : null;
    const repeatWeekdays =
      v.repeat === 'weekdays' ? WEEKDAYS_MASK
      : v.repeat === 'weekend' ? WEEKEND_MASK
      : v.repeat === 'days' ? daysToMask(v.days)
      : null;
    const recurring = repeatIntervalDays !== null || repeatWeekdays !== null;
    const req: TaskRequest = {
      title: v.title.trim(),
      description: v.description.trim() || null,
      categoryId: v.categoryId,
      startDate: toIsoDate(v.startDate!),
      dueTime: v.dueTime || null,
      repeatIntervalDays,
      repeatWeekdays,
      endDate: recurring && v.endDate ? toIsoDate(v.endDate) : null,
    };

    this.saving.set(true);
    this.error.set(null);
    const call = this.data.task ? this.taskApi.update(this.data.task.id, req) : this.taskApi.create(req);
    call.subscribe({
      next: () => this.ref.close('saved'),
      error: (err) => {
        this.saving.set(false);
        this.error.set(errorMessage(err, 'Nem sikerült menteni.'));
      },
    });
  }

  remove(): void {
    const task = this.data.task!;
    const message = isRecurring(task)
      ? `A(z) „${task.title}” minden ismétlődése törlődik, a korábbi pipákkal együtt.`
      : `A(z) „${task.title}” véglegesen törlődik.`;

    confirm(this.dialog, { title: 'Teendő törlése', message }).subscribe((ok) => {
      if (!ok) return;
      this.saving.set(true);
      this.taskApi.delete(task.id).subscribe({
        next: () => this.ref.close('deleted'),
        error: (err) => {
          this.saving.set(false);
          this.error.set(errorMessage(err, 'Nem sikerült törölni.'));
        },
      });
    });
  }
}
function repeatModeOf(days: number | null, mask: number | null): RepeatMode {
  if (mask === WEEKDAYS_MASK) return 'weekdays';
  if (mask === WEEKEND_MASK) return 'weekend';
  if (mask !== null) return 'days';
  if (days === null) return 'once';
  if (days === 1) return '1';
  if (days === 2) return '2';
  return 'custom';
}

/** Megnyitja a teendő-párbeszédablakot; a hívó a bezáráskor frissít. */
export function openTaskDialog(dialog: MatDialog, data: TaskDialogData) {
  return dialog.open<TaskDialog, TaskDialogData, TaskDialogResult>(TaskDialog, {
    data,
    width: '560px',
    maxWidth: '95vw',
    autoFocus: 'first-tabbable',
  });
}
