import { DOCUMENT } from '@angular/common';
import { Component, NgZone, OnDestroy, OnInit, inject, signal } from '@angular/core';
@Component({selector: 'site-intro-heading', template: `    <div class="page-heading">
      <h1 class="terminal-heading">
        <span class="sr-only">{{ headingText }}</span>
        <span class="heading-reserve" aria-hidden="true">&gt; {{ headingText }}_</span>
        <span class="heading-typed" aria-hidden="true">&gt; {{ typedHeading() }}<span class="terminal-cursor" [class.typing-complete]="typedHeading() === headingText">_</span></span>
      </h1>
      <hr class="intro-heading-separator" />
    </div>
`})
export class IntroHeadingComponent implements OnInit, OnDestroy {
  readonly headingText = "Hi, I am Gopal 👋. Full-stack software engineer experienced in designing, developing and deploying production systems. My core stack includes TypeScript, Python, FastAPI, Node.js and NestJS along with architecting and provisioning AWS with Terraform.";
  readonly typedHeading = signal("");
  private readonly document = inject(DOCUMENT);
  private readonly zone = inject(NgZone);
  private typingTimer?: ReturnType<typeof setInterval>;
  private motionPreference?: MediaQueryList;
  private readonly motionChanged = (event: MediaQueryListEvent) => {
    if (event.matches) this.finishTyping();
  };

  ngOnInit(): void {
    const win = this.document.defaultView;
    this.motionPreference = win?.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!win || this.motionPreference?.matches) {
      this.finishTyping();
      return;
    }
    this.motionPreference?.addEventListener("change", this.motionChanged);
    // The decorative timer must not keep Angular application stability pending.
    this.zone.runOutsideAngular(() => {
      this.typingTimer = setInterval(() => {
        this.typedHeading.update((text) => this.headingText.slice(0, text.length + 1));
        if (this.typedHeading() === this.headingText) this.finishTyping();
      }, 24);
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.typingTimer);
    this.motionPreference?.removeEventListener("change", this.motionChanged);
  }

  private finishTyping(): void {
    clearInterval(this.typingTimer);
    this.typingTimer = undefined;
    this.typedHeading.set(this.headingText);
  }
}
