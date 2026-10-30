import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CategoryApi } from '../core/api.services';
import { errorMessage } from '../core/error-message';
import { Category } from '../core/models';

/** Előre megadott színek – jól megkülönböztethetők világos és sötét módban is. */
export const PRESET_COLORS = [
  '#E53935', '#FB8C00', '#FDD835', '#43A047', '#00897B',
  '#039BE5', '#3949AB', '#8E24AA', '#D81B60', '#6D4C41', '#757575',
];

@Component({
  selector: 'app-category-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Kategória szerkesztése' : 'Új kategória' }}</h2>
    <mat-dialog-content>
      <form id="category-form" [formGroup]="form" (ngSubmit)="save()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Név</mat-label>
          <input matInput formControlName="name" maxlength="100" placeholder="pl. Munka, Otthon, Sport" />
          @if (form.controls.name.hasError('required')) {
            <mat-error>Adj meg egy nevet</mat-error>
          }
        </mat-form-field>

        <p class="label">Szín</p>
        <div class="swatches" role="radiogroup" aria-label="Szín">
          @for (c of presets; track c) {
            <button type="button" class="swatch" role="radio" [style.background]="c"
                    [class.active]="form.controls.color.value.toUpperCase() === c"
                    [attr.aria-checked]="form.controls.color.value.toUpperCase() === c"
                    [attr.aria-label]="c" (click)="form.controls.color.setValue(c)">
              @if (form.controls.color.value.toUpperCase() === c) {
                <mat-icon>check</mat-icon>
              }
            </button>
          }
          <label class="swatch custom" [class.active]="isCustom()" [style.background]="isCustom() ? form.controls.color.value : null"
                 title="Egyéni szín">
            <mat-icon>{{ isCustom() ? 'check' : 'colorize' }}</mat-icon>
            <input type="color" formControlName="color" aria-label="Egyéni szín" />
          </label>
        </div>

        @if (error()) {
          <p class="form-error">{{ error() }}</p>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close type="button">Mégse</button>
      <button mat-flat-button type="submit" form="category-form" [disabled]="saving()">Mentés</button>
    </mat-dialog-actions>
  `,
  styles: `
    form {
      padding-top: 8px;
    }
    .label {
      margin: 0 0 8px;
      color: var(--mat-sys-on-surface-variant);
    }
    .swatches {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 12px;
    }
    .swatch {
      all: unset;
      box-sizing: border-box;
      cursor: pointer;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      color: #fff;
      border: 2px solid transparent;
      position: relative;
    }
    .swatch.active {
      border-color: var(--mat-sys-on-surface);
    }
    .swatch:focus-visible,
    .swatch.custom:focus-within {
      outline: 2px solid var(--mat-sys-primary);
      outline-offset: 2px;
    }
    .swatch mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .custom {
      background: var(--mat-sys-surface-container-highest);
      color: var(--mat-sys-on-surface);
    }
    .custom.active {
      color: #fff;
    }
    .custom input {
      position: absolute;
      inset: 0;
      opacity: 0;
      cursor: pointer;
    }
  `,
})
export class CategoryDialog {
  protected readonly data = inject<Category | null>(MAT_DIALOG_DATA);
  private readonly ref = inject<MatDialogRef<CategoryDialog, boolean>>(MatDialogRef);
  private readonly api = inject(CategoryApi);

  protected readonly presets = PRESET_COLORS;
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = inject(FormBuilder).nonNullable.group({
    name: [this.data?.name ?? '', [Validators.required, Validators.maxLength(100)]],
    color: [this.data?.color ?? PRESET_COLORS[5], [Validators.required, Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]],
  });

  isCustom(): boolean {
    return !PRESET_COLORS.includes(this.form.controls.color.value.toUpperCase());
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const req = { name: v.name.trim(), color: v.color.toUpperCase() };
    this.saving.set(true);
    this.error.set(null);

    const call = this.data ? this.api.update(this.data.id, req) : this.api.create(req);
    call.subscribe({
      next: () => this.ref.close(true),
      error: (err) => {
        this.saving.set(false);
        this.error.set(errorMessage(err, 'Nem sikerült menteni.'));
      },
    });
  }
}

export function openCategoryDialog(dialog: MatDialog, category: Category | null) {
  return dialog.open<CategoryDialog, Category | null, boolean>(CategoryDialog, {
    data: category,
    width: '440px',
    maxWidth: '95vw',
  });
}
