// A backend DTO-inak TypeScript megfelelői. A dátumok ISO szövegek: "2026-10-30".

export interface AuthResponse {
  token: string;
  username: string;
  expiresInSeconds: number;
}

export interface MessageResponse {
  message: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface Category {
  id: number;
  name: string;
  color: string;
}

export interface CategoryRequest {
  name: string;
  color: string;
}

/** Egy teendő egy adott napon (GET /api/tasks?date=...). */
export interface DayTask {
  id: number;
  title: string;
  description: string | null;
  date: string;
  dueTime: string | null;
  repeatIntervalDays: number | null;
  categoryId: number | null;
  categoryName: string | null;
  categoryColor: string | null;
  repeatWeekdays: number | null;
  endTime: string | null;
    /** ki van-e már pipálva ezen a napon */
  completed: boolean;
}

/** Egy teendő minden adata (GET /api/tasks/all, /api/tasks/{id}). */
export interface TaskDetail {
  id: number;
  title: string;
  description: string | null;
  category: Category | null;
  startDate: string;
  dueTime: string | null;
  repeatIntervalDays: number | null;
  endDate: string | null;
  repeatWeekdays: number | null;
  endTime: string | null;
}

export interface TaskRequest {
  title: string;
  description: string | null;
  categoryId: number | null;
  startDate: string;
  dueTime: string | null;
  repeatIntervalDays: number | null;
  endDate: string | null;
  repeatWeekdays: number | null;
  endTime: string | null;
}

/** Egy nap összesítése a naptárhoz (GET /api/calendar). */
export interface CalendarDay {
  date: string;
  total: number;
  completed: number;
  open: number;
  colors: string[];
}
