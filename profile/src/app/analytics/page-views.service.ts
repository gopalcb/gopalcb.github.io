import { DOCUMENT } from "@angular/common";
import { DestroyRef, Injectable, inject } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { NavigationEnd, Router } from "@angular/router";
import { filter } from "rxjs";

// Existing CloudFront front door supplies trusted geography and the private
// origin header; never put the Lambda origin secret in client code.
export const PAGE_VIEW_ENDPOINT =
  "https://d10qhbfu5fjd8s.cloudfront.net/gb-portfolio/get-content";
export const VISIT_STORAGE_KEY = "self-made-dev.visit.v1";
const IDLE_MS = 30 * 60 * 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable({ providedIn: "root" })
export class PageViewsService {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private started = false;
  private lastPath = "";
  private visit?: { id: string; lastSeen: number };

  start(): void {
    const win = this.document.defaultView;
    if (this.started || !win || win.top !== win.self) return;
    this.started = true;
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((event) => this.track(event.urlAfterRedirects));
  }

  private track(url: string): void {
    // Telemetry is best-effort: even blocked browser storage/network must not
    // interfere with navigation, workspace loading or the rendered page.
    try {
      const win = this.document.defaultView!;
      const path = new URL(url, win.location.origin).pathname;
      if (path === this.lastPath) return;
      this.lastPath = path;
      if (path === "/admin" || path.startsWith("/admin/")) return;
      const now = Date.now();
      const session = this.session(now);
      void fetch(PAGE_VIEW_ENDPOINT, {
        method: "POST",
        mode: "cors",
        credentials: "omit",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Separators are JSON body data, not a URL fragment.
          page_path: `${path.slice(0, 512)}#${session}#${crypto.randomUUID()}`,
        }),
      }).catch(() => undefined);
    } catch {
      // Browser privacy restrictions must never break the site.
    }
  }

  private session(now: number): string {
    if (!this.visit) {
      try {
        const stored = JSON.parse(this.document.defaultView!.sessionStorage.getItem(VISIT_STORAGE_KEY) || "null");
        if (stored && typeof stored.id === "string" && UUID.test(stored.id) && Number.isFinite(stored.lastSeen)) {
          this.visit = stored;
        }
      } catch {
        // Keep an in-memory session if storage is unavailable or malformed.
      }
    }
    if (!this.visit || now - this.visit.lastSeen >= IDLE_MS || now < this.visit.lastSeen) {
      this.visit = { id: crypto.randomUUID(), lastSeen: now };
    }
    this.visit.lastSeen = now;
    try {
      this.document.defaultView!.sessionStorage.setItem(VISIT_STORAGE_KEY, JSON.stringify(this.visit));
    } catch {
      // The in-memory visit still groups this tab's route changes.
    }
    return this.visit.id;
  }
}
