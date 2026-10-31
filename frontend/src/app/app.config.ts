import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import localeHu from '@angular/common/locales/hu';
import {
  ApplicationConfig,
  LOCALE_ID,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  isDevMode,
} from '@angular/core';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
  MAT_NATIVE_DATE_FORMATS,
} from '@angular/material/core';
import { MatIconRegistry } from '@angular/material/icon';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { apiBaseInterceptor } from './core/api-base.interceptor';
import { authInterceptor } from './core/auth.interceptor';
import { serverWakeInterceptor } from './core/server-wake';
import { HuDateAdapter } from './core/hu-date-adapter';
import { provideServiceWorker } from '@angular/service-worker';

registerLocaleData(localeHu);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    // sorrend: token hozzáadása -> lassú kérés figyelése -> backend címének eléírása
    provideHttpClient(withInterceptors([authInterceptor, serverWakeInterceptor, apiBaseInterceptor])),

    // magyar dátum- és számformátum (DatePipe: "október 30., péntek")
    { provide: LOCALE_ID, useValue: 'hu' },
    { provide: MAT_DATE_LOCALE, useValue: 'hu-HU' },
    { provide: DateAdapter, useClass: HuDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS },

    // az index.html a Material Symbols ikonkészletet tölti be
    provideAppInitializer(() => {
      inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-outlined');
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
