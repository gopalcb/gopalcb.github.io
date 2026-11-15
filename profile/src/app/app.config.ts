import { NotesStore } from "./notes/notes.store";
import { PageViewsService } from "./analytics/page-views.service";
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
} from "@angular/core";
import { provideRouter, withInMemoryScrolling } from "@angular/router";
import { routes } from "./app.routes";
export const appConfig: ApplicationConfig = {
  providers: [
    provideAppInitializer(() => inject(PageViewsService).start()),
    provideAppInitializer(() => inject(NotesStore).load()),
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: "enabled",
        anchorScrolling: "enabled",
      }),
    ),
  ],
};
