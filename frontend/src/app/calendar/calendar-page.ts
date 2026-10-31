import { DatePipe } from '@angular/common';
import { DestroyRef, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CalendarApi, TaskApi } from '../core/api.services';
import {
  addDays,
  addMonths,
  isSameDay,
  isRecurring,
  repeatLabel,
  timeRange,
  startOfMonth,
  toIsoDate,
  today,
  weekdayIndex, 
  hhmm, 
  shortTime
} from '../core/date-utils';
import { errorMessage } from '../core/error-message';
import { CalendarDay, DayTask } from '../core/models';
import { openTaskDialog } from '../tasks/task-dialog';

interface Cell {
  date: Date;
  iso: string;
  inMonth: boolean;
  isToday: boolean;
  isPast: boolean;
}

@Component({
  selector: 'app-calendar-page',
  imports: [DatePipe, MatButtonModule, MatIconModule, MatCheckboxModule, MatProgressBarModule, MatTooltipModule],
  templateUrl: './calendar-page.html',
  styleUrl: './calendar-page.scss',
})
export class CalendarPage implements OnInit {
  private readonly calendarApi = inject(CalendarApi);
  private readonly taskApi = inject(TaskApi);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly weekdays = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'];
  protected readonly repeatLabel = repeatLabel;
  protected readonly timeRange = timeRange;
  protected readonly isRecurring = isRecurring;

  /** Percenként frissül, hogy a "Lejárt" jelzés magától megjelenjen. */
  readonly now = signal(new Date());

  constructor() {
    const timer = setInterval(() => this.now.set(new Date()), 60_000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  /** A megjelenített hónap első napja. */
  readonly month = signal(startOfMonth(today()));
  readonly selected = signal(today());

  readonly summaries = signal(new Map<string, CalendarDay>());
  readonly dayTasks = signal<DayTask[]>([]);
  readonly openTasks = computed(() => this.dayTasks().filter((t) => !t.completed));
  readonly doneTasks = computed(() => this.dayTasks().filter((t) => t.completed));
  /** a "Teljesítve" rész ki van-e nyitva */
  readonly showDone = signal(true);
  readonly loadingMonth = signal(false);
  readonly loadingDay = signal(false);
  /** A pipálás alatt lévő teendők – hogy ne lehessen kétszer kattintani. */
  readonly busy = signal(new Set<number>());

  /** A havi rács: hétfőtől vasárnapig, a szomszédos hónapok napjaival kiegészítve (4–6 sor). */
  readonly cells = computed<Cell[]>(() => {
    const first = this.month();
    const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
    const start = addDays(first, -weekdayIndex(first));
    const end = addDays(last, 6 - weekdayIndex(last));
    const now = today();

    const cells: Cell[] = [];
    for (let d = start; d <= end; d = addDays(d, 1)) {
      cells.push({
        date: d,
        iso: toIsoDate(d),
        inMonth: d.getMonth() === first.getMonth(),
        isToday: isSameDay(d, now),
        isPast: d < now,
      });
    }
    return cells;
  });

  readonly selectedIso = computed(() => toIsoDate(this.selected()));
  readonly selectedSummary = computed(() => this.summaries().get(this.selectedIso()));
  /** A "Ma" gomb csak akkor kell, ha nem a mai nap / hónap látszik. */
  readonly showingToday = computed(
    () => isSameDay(this.month(), startOfMonth(today())) && isSameDay(this.selected(), today()),
  );

  ngOnInit(): void {
    this.loadMonth();
    this.loadDay();
  }

  // ===================== Navigáció =====================

  prevMonth(): void {
    this.month.set(addMonths(this.month(), -1));
    this.loadMonth();
  }

  nextMonth(): void {
    this.month.set(addMonths(this.month(), 1));
    this.loadMonth();
  }

  goToday(): void {
    const now = today();
    const monthChanged = !isSameDay(this.month(), startOfMonth(now));
    this.month.set(startOfMonth(now));
    this.select(now, false);
    if (monthChanged) this.loadMonth();
  }

  /** Napra kattintás. Ha a szomszéd hónap egy napja, oda is lapoz. */
  select(date: Date, followMonth = true): void {
    this.selected.set(date);
    if (followMonth && date.getMonth() !== this.month().getMonth()) {
      this.month.set(startOfMonth(date));
      this.loadMonth();
    }
    this.loadDay();
  }

  /** Keskeny kijelzőn a nap teendői a naptár alatt vannak – oda görgetünk. */
  revealDay(panel: HTMLElement): void {
    if (window.matchMedia('(max-width: 900px)').matches) {
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
    /**
   * Lejárt-e a (még ki nem pipált) teendő a kiválasztott napon:
   * - elmúlt napon mindig
   * - ma, ha elmúlt a befejezés, vagy ha nincs befejezés, a kezdés időpontja
   * - időpont nélkül csak a nap végén
   */
  isOverdue(task: DayTask): boolean {
    const now = this.now();
    const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const day = this.selected();
    if (day < nowDay) return true;
    if (day > nowDay) return false;
    const deadline = shortTime(task.endTime ?? task.dueTime);
    return deadline !== null && hhmm(now) > deadline;
  }

  // ===================== Teendők =====================

  complete(task: DayTask): void {
    const date = this.selectedIso();
    this.setBusy(task.id, true);

    this.taskApi.complete(task.id, date).subscribe({
      next: () => {
        this.setBusy(task.id, false);
        this.markCompleted(task.id, true);
        this.loadMonth();

        this.snackBar
          .open(`„${task.title}” kész`, 'Visszavonás', { duration: 5000 })
          .onAction()
          .subscribe(() => this.undo(task, date));
      },
      error: (err) => {
        this.setBusy(task.id, false);
        this.snackBar.open(errorMessage(err, 'Nem sikerült kipipálni.'), 'OK', { duration: 5000 });
      },
    });
  }
  /** A "Teljesítve" listában a pipa kivétele: visszakerül a nyitottak közé. */
  uncomplete(task: DayTask): void {
    this.setBusy(task.id, true);
    this.undo(task, this.selectedIso());
  }

  private undo(task: DayTask, date: string): void {
    this.taskApi.undoComplete(task.id, date).subscribe({
      next: () => {
        this.setBusy(task.id, false);
        if (date === this.selectedIso()) this.markCompleted(task.id, false);
        this.loadMonth();
      },
      error: (err) => {
        this.setBusy(task.id, false);
        this.snackBar.open(errorMessage(err), 'OK', { duration: 5000 });
      },
    });
  }

  private markCompleted(id: number, completed: boolean): void {
    this.dayTasks.update((list) => list.map((t) => (t.id === id ? { ...t, completed } : t)));
  }

  newTask(): void {
    openTaskDialog(this.dialog, { date: this.selectedIso() })
      .afterClosed()
      .subscribe((result) => {
        if (result) this.refresh();
      });
  }

  edit(task: DayTask): void {
    this.taskApi.get(task.id).subscribe({
      next: (detail) =>
        openTaskDialog(this.dialog, { task: detail })
          .afterClosed()
          .subscribe((result) => {
            if (result) this.refresh();
          }),
      error: (err) => this.snackBar.open(errorMessage(err), 'OK', { duration: 5000 }),
    });
  }

  // ===================== Betöltés =====================

  private refresh(): void {
    this.loadMonth();
    this.loadDay();
  }

  private loadMonth(): void {
    const cells = this.cells();
    const from = cells[0].iso;
    const to = cells[cells.length - 1].iso;
    this.loadingMonth.set(true);

    this.calendarApi.range(from, to).subscribe({
      next: (days) => {
        // ha közben továbblapoztak, a régi választ eldobjuk
        if (this.cells()[0].iso !== from) return;
        this.summaries.set(new Map(days.map((d) => [d.date, d])));
        this.loadingMonth.set(false);
      },
      error: (err) => {
        this.loadingMonth.set(false);
        this.snackBar.open(errorMessage(err, 'Nem sikerült betölteni a naptárat.'), 'OK', { duration: 5000 });
      },
    });
  }

  private loadDay(): void {
    const date = this.selectedIso();
    this.loadingDay.set(true);

    this.taskApi.forDay(date).subscribe({
      next: (tasks) => {
        if (this.selectedIso() !== date) return;
        this.dayTasks.set(tasks);
        this.loadingDay.set(false);
      },
      error: (err) => {
        this.loadingDay.set(false);
        this.snackBar.open(errorMessage(err, 'Nem sikerült betölteni a teendőket.'), 'OK', { duration: 5000 });
      },
    });
  }

  private setBusy(id: number, busy: boolean): void {
    this.busy.update((set) => {
      const next = new Set(set);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  }
}
