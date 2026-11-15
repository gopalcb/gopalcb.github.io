import { IconComponent } from '../icon/icon.component';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
  OnDestroy,
  inject,
} from '@angular/core';
export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}
/** Reference dropdown rendered above clipping containers with viewport-aware placement. */
@Component({
  imports: [IconComponent],
  selector: 'wo-select',
  templateUrl: './select.component.html',
})
export class SelectComponent implements OnDestroy {
  @Input() value = '';
  @Input() label = 'Choose an option';
  @Input() options: SelectOption[] = [];
  @Input() disabled = false;
  @Output() valueChange = new EventEmitter<string>();
  @ViewChild('menu', { static: true }) menu!: ElementRef<HTMLElement>;
  @ViewChild('trigger', { static: true }) trigger!: ElementRef<HTMLButtonElement>;
  private readonly host = inject(ElementRef<HTMLElement>);
  readonly supportsPopover =
    typeof HTMLElement !== 'undefined' && 'showPopover' in HTMLElement.prototype;
  open = false;
  active = 0;
  static nextId = 0;
  readonly id = 'tm-select-' + SelectComponent.nextId++;
  private frame = 0;
  private readonly reposition = () => {
    if (this.open) {
      this.position();
    }
  };
  get selectedLabel(): string {
    return this.options.find((option) => option.value === this.value)?.label ?? this.label;
  }
  toggle(): void {
    if (this.open) {
      this.close();

      return;
    }

    if (this.disabled || this.trigger.nativeElement.matches(':disabled')) {
      return;
    }

    this.open = true;

    this.active = Math.max(
      0,
      this.options.findIndex((option) => option.value === this.value),
    );
    const menu = this.menu.nativeElement;

    // Set the opening direction before the browser captures its starting style.
    this.position();

    menu.hidden = false;

    if (this.supportsPopover) {
      menu.showPopover();
    }

    this.position();

    this.frame = requestAnimationFrame(() => {
      this.position();

      this.revealActive();
    });

    window.addEventListener('resize', this.reposition);

    document.addEventListener('scroll', this.reposition, true);

    window.visualViewport?.addEventListener('resize', this.reposition);
  }
  position(): void {
    const rect = this.trigger.nativeElement.getBoundingClientRect(),
      menu = this.menu.nativeElement;
    const viewport = window.visualViewport;
    const left = viewport?.offsetLeft ?? 0,
      top = viewport?.offsetTop ?? 0;
    const width = viewport?.width ?? window.innerWidth,
      height = viewport?.height ?? window.innerHeight;
    const gap = 5,
      pad = 8,
      bottom = top + height;
    const below = Math.max(0, bottom - rect.bottom - gap - pad),
      above = Math.max(0, rect.top - top - gap - pad);
    const borderHeight = menu.offsetHeight - menu.clientHeight;
    const desired = Math.min(
      240,
      (menu.scrollHeight || this.options.length * rect.height + 12) + borderHeight,
    );
    const upward = below < desired && above > below;
    const available = upward ? above : below;
    const menuHeight = Math.min(desired, available);
    const menuWidth = Math.min(Math.max(rect.width, 120), width - pad * 2);

    Object.assign(menu.style, {
      position: 'fixed',
      inset: 'auto',
      margin: '0',
      width: menuWidth + 'px',
      maxHeight: menuHeight + 'px',
      left: Math.max(left + pad, Math.min(rect.left, left + width - pad - menuWidth)) + 'px',
      top:
        Math.max(
          top + pad,
          upward
            ? rect.top - gap - menuHeight
            : Math.min(rect.bottom + gap, bottom - pad - menuHeight),
        ) + 'px',
    });

    menu.dataset['direction'] = upward ? 'up' : 'down';
  }
  close(): void {
    cancelAnimationFrame(this.frame);
    const menu = this.menu?.nativeElement;

    if (menu && this.supportsPopover && menu.matches(':popover-open')) {
      menu.hidePopover();
    }

    if (menu) {
      menu.hidden = true;
    }

    this.open = false;

    window.removeEventListener('resize', this.reposition);

    document.removeEventListener('scroll', this.reposition, true);

    window.visualViewport?.removeEventListener('resize', this.reposition);
  }
  choose(value: string): void {
    if (this.disabled || this.trigger.nativeElement.matches(':disabled')) {
      return;
    }

    const trigger = this.trigger?.nativeElement;

    this.value = value;
    this.close();
    trigger?.focus();

    // Emit only after the popup is closed and focus is restored. A parent may
    // synchronously replace this select in response to the new value.
    this.valueChange.emit(value);
  }
  revealActive(): void {
    this.menu.nativeElement
      .querySelector<HTMLElement>('#' + this.id + '-' + this.active)
      ?.scrollIntoView?.({ block: 'nearest' });
  }
  key(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.open) {
      this.close();

      event.stopPropagation();

      event.preventDefault();
    } else if (event.key === 'Tab') {
      this.close();
    } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();

      if (!this.open) {
        this.toggle();

        return;
      }

      this.active =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? this.options.length - 1
            : Math.max(
                0,
                Math.min(
                  this.options.length - 1,
                  this.active + (event.key === 'ArrowDown' ? 1 : -1),
                ),
              );

      this.revealActive();
    } else if (this.open && ['Enter', ' '].includes(event.key)) {
      event.preventDefault();

      if (this.options[this.active]) {
        this.choose(this.options[this.active].value);
      }
    }
  }
  @HostListener('document:click', ['$event']) outside(event: MouseEvent): void {
    if (this.open && !this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }
  ngOnDestroy(): void {
    this.close();
  }
}
