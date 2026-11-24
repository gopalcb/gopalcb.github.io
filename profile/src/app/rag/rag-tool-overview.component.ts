import { DOCUMENT } from "@angular/common";
import { Component, DestroyRef, computed, inject, input, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { WoButtonComponent } from "../../theme/controls";
import { IconComponent } from "../components/icon/icon.component";

const CASES = [
  {
    id: "hit", title: "Memory hit", number: 1,
    result: "Relevant memory found", evidence: "Matching notes and reusable code",
    reply: "Plan and context", plan: "Main agent adapts the returned plan",
    planDetail: "Uses matching context and verifies it against the task",
  },
  {
    id: "miss", title: "Memory miss", number: 2,
    result: "No relevant memory", evidence: "The lookup returns a miss",
    reply: "Miss · report back", plan: "Main agent drafts its own plan",
    planDetail: "If needed, gets a quick web summary while a deeper crawl runs in the background",
  },
  { id: "skip", title: "Skip lookup", number: 3 },
] as const;

@Component({
  selector: "app-rag-tool-overview",
  imports: [IconComponent, RouterLink, WoButtonComponent],
  templateUrl: "./rag-tool-overview.component.html",
  styleUrl: "./rag-tool-overview.component.css",
})
export class RagToolOverviewComponent {
  readonly guidePath = input<string>();
  readonly sharingPath = input<string>();
  private readonly media = inject(DOCUMENT).defaultView?.matchMedia?.("(prefers-reduced-motion: reduce)");
  private readonly reducedMotion = signal(this.media?.matches ?? false);
  private readonly caseIndex = signal(0);
  readonly visibleCases = computed(() => this.reducedMotion() ? CASES : [CASES[this.caseIndex()]]);

  constructor() {
    const update = (event: MediaQueryListEvent) => this.reducedMotion.set(event.matches);
    this.media?.addEventListener("change", update);
    inject(DestroyRef).onDestroy(() => this.media?.removeEventListener("change", update));
  }

  advanceCase() {
    if (!this.reducedMotion()) {
      this.caseIndex.update(index => (index + 1) % CASES.length);
    }
  }
}
