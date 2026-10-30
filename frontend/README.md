# Teendőnaptár – frontend

Angular 22 + Angular Material. A Spring Boot backendet a `/api` útvonalon hívja.

## Indítás

Kell hozzá **Node.js 24** (vagy legalább 22.22.3) – `node -v`-vel ellenőrizhető.

```bash
npm install
npm start
```

Ezután: <http://localhost:4200>

Fejlesztés közben a `proxy.conf.json` minden `/api/...` kérést továbbít a `http://localhost:8080`-ra,
tehát a Spring Bootnak is futnia kell.

## Felépítés

```
src/app/
├── core/                 közös réteg
│   ├── models.ts         a backend DTO-i TypeScriptben
│   ├── api.services.ts   TaskApi, CategoryApi, CalendarApi
│   ├── auth.service.ts   bejelentkezés, a token tárolása (localStorage)
│   ├── auth.interceptor.ts   minden kéréshez hozzáteszi a tokent; 401-nél kijelentkeztet
│   ├── auth.guards.ts    authGuard / guestGuard
│   ├── date-utils.ts     dátumkezelés helyi idő szerint
│   ├── error-message.ts  a backend hibaüzenetének kiolvasása
│   └── hu-date-adapter.ts    magyar dátumválasztó (hétfővel kezdődő hét)
├── auth/                 bejelentkezés, regisztráció, e-mail megerősítés
├── layout/shell.ts       felső sáv + navigáció
├── calendar/             havi naptár + a kiválasztott nap teendői
├── tasks/                teendők listája + létrehozó/szerkesztő ablak
├── categories/           kategóriák + létrehozó/szerkesztő ablak
└── shared/               megerősítő ablak
```
