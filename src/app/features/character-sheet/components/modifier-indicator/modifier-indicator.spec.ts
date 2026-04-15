import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { ModifierIndicator } from './modifier-indicator';
import { DisplayStat } from '../../models/character-sheet-view.model';

@Component({
  selector: 'app-test-host',
  imports: [ModifierIndicator],
  template: `<app-modifier-indicator [stat]="stat()" [statLabel]="label()" />`,
})
class HostComponent {
  readonly stat = signal<DisplayStat>({
    base: 10,
    modified: 10,
    hasModifier: false,
    modifierSources: [],
  });
  readonly label = signal('Hit Points max');
}

describe('ModifierIndicator', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<HostComponent>>;
  let host: HostComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders nothing when hasModifier is false', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.mod-indicator')).toBeNull();
  });

  it('renders glyph and tooltip rows when hasModifier is true', () => {
    host.stat.set({
      base: 10,
      modified: 12,
      hasModifier: true,
      modifierSources: [
        { sourceName: "Warrior's Vigor", operation: 'ADD', value: 1 },
        { sourceName: 'Plate Armor', operation: 'ADD', value: 1 },
      ],
    });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.mod-indicator')).not.toBeNull();
    expect(el.querySelector('.mod-indicator__glyph')?.textContent).toContain('\u25C6');
    const rows = el.querySelectorAll('.mod-indicator__tooltip-row');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain("Warrior's Vigor");
    expect(rows[0].textContent).toContain('+1');
  });

  it('builds aria-label with base, modified, and each source name', () => {
    host.stat.set({
      base: 10,
      modified: 12,
      hasModifier: true,
      modifierSources: [
        { sourceName: "Warrior's Vigor", operation: 'ADD', value: 1 },
        { sourceName: 'Plate Armor', operation: 'ADD', value: 1 },
      ],
    });
    fixture.detectChanges();

    const wrapper = fixture.nativeElement.querySelector('.mod-indicator') as HTMLElement;
    const aria = wrapper.getAttribute('aria-label') ?? '';
    expect(aria).toContain('Hit Points max');
    expect(aria).toContain('12');
    expect(aria).toContain('base 10');
    expect(aria).toContain("Warrior's Vigor");
    expect(aria).toContain('Plate Armor');
  });
});
