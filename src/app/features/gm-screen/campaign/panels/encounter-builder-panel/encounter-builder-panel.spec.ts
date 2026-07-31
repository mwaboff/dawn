import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { EncounterBuilderPanel } from './encounter-builder-panel';

describe('EncounterBuilderPanel', () => {
  let fixture: ComponentFixture<EncounterBuilderPanel>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [EncounterBuilderPanel] });
    fixture = TestBed.createComponent(EncounterBuilderPanel);
    fixture.detectChanges();
  });

  it('renders a coming soon placeholder', () => {
    expect(fixture.nativeElement.querySelector('.eb__lead').textContent).toContain('Coming soon');
  });

  it('names what the panel will eventually do', () => {
    expect(fixture.nativeElement.textContent).toContain('Battle Points');
  });
});
