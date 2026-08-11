import { ChangeDetectionStrategy, Component, TemplateRef, output, viewChild } from '@angular/core';
import { CdkMenu, CdkMenuItem } from '@angular/cdk/menu';
import { RollOption } from './roll-options.directive';

/**
 * The Advantage / Normal / Disadvantage menu content. Never placed in a template directly --
 * `RollOptionsDirective` creates it with `ViewContainerRef.createComponent()` and wires its
 * `menuTemplateRef` into a `CdkContextMenuTrigger`, which projects it into an overlay on demand.
 * `CdkMenu` supplies `role="menu"`, arrow-key navigation, typeahead and roving-tabindex focus
 * management; `CdkMenuItem` supplies `role="menuitem"` and keyboard activation (Enter/Space).
 */
@Component({
  selector: 'app-roll-options-menu',
  templateUrl: './roll-options-menu.html',
  styleUrl: './roll-options-menu.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CdkMenu, CdkMenuItem],
})
export class RollOptionsMenu {
  /** Resolved once the directive forces a change-detection pass after creating this component. */
  readonly menuTemplateRef = viewChild.required('menu', { read: TemplateRef });

  readonly optionSelected = output<RollOption>();

  select(option: RollOption): void {
    this.optionSelected.emit(option);
  }
}
