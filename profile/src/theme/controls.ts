import { Component, Input } from '@angular/core';
import { IconComponent } from '../app/components/icon/icon.component';

/** One border-box size for ordinary controls, including native ngModel/FormControl bindings. */
const controlHost = {
  '[style.height]': "'var(--tm-control-height)'",
  '[style.min-height]': "'var(--tm-control-height)'",
  '[style.box-sizing]': "'border-box'",
  '[style.padding-block]': "'var(--tm-control-padding-block, 5px)'",
  '[style.line-height]': "'16px'",
};

/** Native attributes, labels, values and input/change events stay on the real input. */
@Component({
  selector: 'input[woTextInput]',
  template: '',
  host: { ...controlHost, class: 'wo-textbox' },
})
export class WoTextboxComponent {}

/** Keep native semantics and reserve all labels for smooth, stable action feedback. */
@Component({
  selector: 'button[woButton], a[woButton]',
  imports: [IconComponent],
  template: `
    <ng-content />
    @if (buttonLabels.length) {
      <span class="wo-button-states">
        @for (label of stateLabels; track label) {
          <span
            class="wo-button-state"
            [class.is-active]="label === buttonLabel"
            [attr.aria-hidden]="label !== buttonLabel ? 'true' : null"
          >
            @if (buttonIcons[label]; as icon) {
              <wo-icon [name]="icon" />
            }
            <span>{{ label }}</span>
          </span>
        }
      </span>
    }
  `,
  host: {
    ...controlHost,
    class: 'wo-button-control',
    '[class.wo-button-success]': 'buttonSuccess',
  },
})
export class WoButtonComponent {
  @Input() buttonLabels: readonly string[] = [];
  @Input() buttonLabel = '';
  @Input() buttonIcons: Readonly<Record<string, IconComponent['name']>> = {};
  @Input() buttonSuccess = false;

  get stateLabels(): readonly string[] {
    return [...new Set([...this.buttonLabels, this.buttonLabel].filter(Boolean))];
  }
}
