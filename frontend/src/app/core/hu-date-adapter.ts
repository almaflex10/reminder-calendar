import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';

/**
 * A dátumválasztó magyar beállításai:
 * - a hét hétfőn kezdődik
 * - a beírt "2026. 10. 30." vagy "2026-10-30" alakot is felismeri
 * - így is jeleníti meg: "2026. 10. 30."
 */
@Injectable()
export class HuDateAdapter extends NativeDateAdapter {
  override getFirstDayOfWeek(): number {
    return 1;
  }

  override parse(value: unknown, parseFormat?: unknown): Date | null {
    if (typeof value === 'string') {
      const m = value.trim().match(/^(\d{4})\D+(\d{1,2})\D+(\d{1,2})\.?$/);
      if (m) {
        const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
        return d.getMonth() === Number(m[2]) - 1 ? d : this.invalid();
      }
    }
    return super.parse(value, parseFormat);
  }

  override format(date: Date, displayFormat: object): string {
    // a beviteli mezőben mindig ugyanaz a rövid alak
    if ('year' in displayFormat && 'day' in displayFormat && 'month' in displayFormat && displayFormat.month === 'numeric') {
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${date.getFullYear()}. ${m}. ${d}.`;
    }
    return super.format(date, displayFormat);
  }
}
