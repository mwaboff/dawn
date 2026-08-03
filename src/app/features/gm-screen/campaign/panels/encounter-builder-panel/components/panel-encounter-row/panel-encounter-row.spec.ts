import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { EncounterResponse } from '../../../../../../../shared/models/encounter-api.model';
import { PanelEncounterRow } from './panel-encounter-row';

function encounter(overrides: Partial<EncounterResponse> = {}): EncounterResponse {
  return {
    id: 3,
    name: 'Ambush at the Ford',
    tier: 2,
    isOfficial: false,
    isPublic: false,
    creatorId: 1,
    adversaries: [],
    adjustmentEasier: false,
    adjustmentTwoPlusSolos: false,
    adjustmentBonusDamage: false,
    adjustmentLowerTier: false,
    adjustmentNoElites: false,
    adjustmentHarder: false,
    suggestedBattlePoints: 11,
    spentBattlePoints: 9,
    createdAt: '',
    lastModifiedAt: '',
    ...overrides,
  };
}

describe('PanelEncounterRow', () => {
  let fixture: ComponentFixture<PanelEncounterRow>;
  let component: PanelEncounterRow;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PanelEncounterRow] });
    fixture = TestBed.createComponent(PanelEncounterRow);
    component = fixture.componentInstance;
  });

  function setInputs(overrides: Partial<{ resuming: boolean; starting: boolean }> = {}): void {
    fixture.componentRef.setInput('encounter', encounter());
    fixture.componentRef.setInput('resuming', overrides.resuming ?? false);
    fixture.componentRef.setInput('starting', overrides.starting ?? false);
    fixture.detectChanges();
  }

  it('renders the name, tier, and Battle Point spend', () => {
    setInputs();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Ambush at the Ford');
    expect(text).toContain('Tier 2');
    expect(text).toContain('9/11 BP');
  });

  it('shows "Multi-tier" when the encounter has no tier', () => {
    fixture.componentRef.setInput('encounter', encounter({ tier: undefined }));
    fixture.componentRef.setInput('resuming', false);
    fixture.componentRef.setInput('starting', false);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Multi-tier');
  });

  it('labels the action "Run" by default', () => {
    setInputs();
    expect(fixture.nativeElement.querySelector('button').textContent.trim()).toBe('Run');
  });

  it('labels the action "Resume" when a run is already active', () => {
    setInputs({ resuming: true });
    expect(fixture.nativeElement.querySelector('button').textContent.trim()).toBe('Resume');
  });

  it('labels the action "Starting…" and disables it while starting', () => {
    setInputs({ starting: true });
    const button = fixture.nativeElement.querySelector('button');
    expect(button.textContent.trim()).toBe('Starting…');
    expect(button.disabled).toBe(true);
  });

  it('emits run when the button is clicked', () => {
    setInputs();
    let emitted = false;
    component.run.subscribe(() => (emitted = true));

    fixture.nativeElement.querySelector('button').click();

    expect(emitted).toBe(true);
  });
});
