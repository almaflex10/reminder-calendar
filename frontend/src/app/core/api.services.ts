import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CalendarDay, Category, CategoryRequest, DayTask, TaskDetail, TaskRequest } from './models';

@Injectable({ providedIn: 'root' })
export class TaskApi {
  private readonly http = inject(HttpClient);

  /** Az adott nap még nyitott teendői. */
  forDay(date: string): Observable<DayTask[]> {
    return this.http.get<DayTask[]>('/api/tasks', { params: { date } });
  }

  all(): Observable<TaskDetail[]> {
    return this.http.get<TaskDetail[]>('/api/tasks/all');
  }

  get(id: number): Observable<TaskDetail> {
    return this.http.get<TaskDetail>(`/api/tasks/${id}`);
  }

  create(req: TaskRequest): Observable<TaskDetail> {
    return this.http.post<TaskDetail>('/api/tasks', req);
  }

  update(id: number, req: TaskRequest): Observable<TaskDetail> {
    return this.http.put<TaskDetail>(`/api/tasks/${id}`, req);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`/api/tasks/${id}`);
  }

  complete(id: number, date: string): Observable<void> {
    return this.http.post<void>(`/api/tasks/${id}/complete`, null, { params: { date } });
  }

  undoComplete(id: number, date: string): Observable<void> {
    return this.http.delete<void>(`/api/tasks/${id}/complete`, { params: { date } });
  }
}

@Injectable({ providedIn: 'root' })
export class CategoryApi {
  private readonly http = inject(HttpClient);

  list(): Observable<Category[]> {
    return this.http.get<Category[]>('/api/categories');
  }

  create(req: CategoryRequest): Observable<Category> {
    return this.http.post<Category>('/api/categories', req);
  }

  update(id: number, req: CategoryRequest): Observable<Category> {
    return this.http.put<Category>(`/api/categories/${id}`, req);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`/api/categories/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class CalendarApi {
  private readonly http = inject(HttpClient);

  range(from: string, to: string): Observable<CalendarDay[]> {
    return this.http.get<CalendarDay[]>('/api/calendar', { params: { from, to } });
  }
}
