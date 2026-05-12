import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { DashboardVariant } from '../../models/dashboard.model';

interface ChipDef { value: DashboardVariant; label: string; }

@Component({
  selector: 'app-variant-switcher',
  templateUrl: './variant-switcher.html',
  styleUrl: './variant-switcher.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VariantSwitcher {
  readonly variant = input.required<DashboardVariant>();
  readonly variantChange = output<DashboardVariant>();

  protected readonly chips: readonly ChipDef[] = [
    { value: 'ledger', label: 'Ledger' },
    { value: 'sheet', label: 'Sheet' },
    { value: 'war-table', label: 'War Table' },
  ];

  protected onSelect(v: DashboardVariant): void {
    if (v !== this.variant()) this.variantChange.emit(v);
  }

  protected onKeydown(event: KeyboardEvent, index: number): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const dir = event.key === 'ArrowLeft' ? -1 : 1;
    const next = (index + dir + this.chips.length) % this.chips.length;
    const target = (event.currentTarget as HTMLElement).parentElement
      ?.querySelectorAll<HTMLButtonElement>('button')[next];
    target?.focus();
    this.variantChange.emit(this.chips[next].value);
  }
}
