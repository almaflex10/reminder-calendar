import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Observable, map } from 'rxjs';

export interface ConfirmData {
  title: string;
  message: string;
  confirmText?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">Mégse</button>
      <button mat-flat-button class="danger" [mat-dialog-close]="true">{{ data.confirmText ?? 'Törlés' }}</button>
    </mat-dialog-actions>
  `,
  styles: `
    @use '@angular/material' as mat;
    .danger {
      @include mat.button-overrides((
        filled-container-color: var(--mat-sys-error),
        filled-label-text-color: var(--mat-sys-on-error),
      ));
    }
  `,
})
export class ConfirmDialog {
  protected readonly data = inject<ConfirmData>(MAT_DIALOG_DATA);
}

/** Megerősítés kérése; true, ha a felhasználó rábólintott. */
export function confirm(dialog: MatDialog, data: ConfirmData): Observable<boolean> {
  return dialog
    .open(ConfirmDialog, { data, width: '400px', autoFocus: 'dialog' })
    .afterClosed()
    .pipe(map((result) => result === true));
}
