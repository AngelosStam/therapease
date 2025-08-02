// src/app/app.config.ts
import { importProvidersFrom } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

export const appConfig = [
  importProvidersFrom(HttpClientModule),
  provideRouter(routes)
];
