import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { CampaignTransformationControl } from './campaign-transformation-control';
import { CampaignCharacterSummary, UpdateCharacterTransformationRequest } from '../../../../shared/models/campaign-api.model';
import { TransformationCardResponse } from '../../../../shared/models/transformation-card-api.model';

function buildSummary(overrides: Partial<CampaignCharacterSummary> = {}): CampaignCharacterSummary {
  return {
    id: 10,
    name: 'Kael',
    level: 3,
    ownerId: 2,
    ownerUsername: 'player1',
    ancestryNames: [],
    classNames: [],
    subclassNames: [],
    transformationEnabled: false,
    companionsEnabled: false,
    ...overrides,
  };
}

function buildCard(id: number, name: string): TransformationCardResponse {
  return { id, name, expansionId: 1, createdAt: '', lastModifiedAt: '' };
}

@Component({
  template: `
    <app-campaign-transformation-control
      controlId="transformation-control-10"
      characterName="Kael"
      [summary]="summary()"
      [catalog]="catalog()"
      [catalogLoading]="catalogLoading()"
      [catalogError]="catalogError()"
      [saving]="saving()"
      (transformationChange)="changed = $event"
      (retryCatalog)="retried = true"
    />
  `,
  imports: [CampaignTransformationControl],
})
class TestHost {
  summary = signal<CampaignCharacterSummary | undefined>(buildSummary());
  catalog = signal<TransformationCardResponse[]>([buildCard(1, 'Vampire'), buildCard(2, 'Werewolf')]);
  catalogLoading = signal(false);
  catalogError = signal(false);
  saving = signal(false);
  changed: UpdateCharacterTransformationRequest | null = null;
  retried = false;
}

describe('CampaignTransformationControl', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  function toggleButton(): HTMLButtonElement {
    return el.querySelector('.grant-toggle-btn') as HTMLButtonElement;
  }

  function select(): HTMLSelectElement {
    return el.querySelector('.transformation-select') as HTMLSelectElement;
  }

  function statusText(): string {
    return el.querySelector('.grant-toggle-status')?.textContent?.trim() ?? '';
  }

  function selectOption(value: string): void {
    const control = select();
    control.value = value;
    control.dispatchEvent(new Event('change'));
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should carry the id referenced by the roster button aria-controls', () => {
    expect(el.querySelector('#transformation-control-10')).toBeTruthy();
  });

  it('should label the toggle with the action it performs when currently off', () => {
    expect(toggleButton().textContent?.trim()).toBe('Turn on');
  });

  it('should label the toggle with the action it performs when currently on', () => {
    host.summary.set(buildSummary({ transformationEnabled: true }));
    fixture.detectChanges();

    expect(toggleButton().textContent?.trim()).toBe('Turn off');
  });

  it('should emit enabled true when turning on', () => {
    toggleButton().click();

    expect(host.changed).toEqual({ enabled: true });
  });

  it('should emit enabled false when turning off', () => {
    host.summary.set(buildSummary({ transformationEnabled: true }));
    fixture.detectChanges();

    toggleButton().click();

    expect(host.changed).toEqual({ enabled: false });
  });

  it('should emit clearTransformationCard when None is selected', () => {
    host.summary.set(buildSummary({ transformationEnabled: true, transformationCardId: 1 }));
    fixture.detectChanges();

    selectOption('');

    expect(host.changed).toEqual({ enabled: true, clearTransformationCard: true });
  });

  it('should emit the selected card id when a card is selected', () => {
    selectOption('2');

    expect(host.changed).toEqual({ enabled: false, transformationCardId: 2 });
  });

  it('should offer None plus every catalog card', () => {
    expect(Array.from(select().options).map(o => o.textContent?.trim())).toEqual(['None', 'Vampire', 'Werewolf']);
  });

  it('should preselect the assigned card', () => {
    host.summary.set(buildSummary({ transformationCardId: 2 }));
    fixture.detectChanges();

    expect(select().value).toBe('2');
  });

  it('should keep the select enabled while the panel is off', () => {
    expect(select().disabled).toBe(false);
  });

  it('should say the panel is hidden when off with no card', () => {
    expect(statusText()).toBe("Hidden from Kael's sheet.");
  });

  it('should say the card is preserved when off with a card', () => {
    host.summary.set(buildSummary({ transformationCardId: 1, transformationCardName: 'Vampire' }));
    fixture.detectChanges();

    expect(statusText()).toBe("Hidden from Kael's sheet. Vampire is saved and comes back when you turn this on.");
  });

  it('should invite the player to choose when on with no card', () => {
    host.summary.set(buildSummary({ transformationEnabled: true }));
    fixture.detectChanges();

    expect(statusText()).toBe('Kael can choose a transformation from their sheet.');
  });

  it('should name the assigned card when on with a card', () => {
    host.summary.set(buildSummary({ transformationEnabled: true, transformationCardId: 1, transformationCardName: 'Vampire' }));
    fixture.detectChanges();

    expect(statusText()).toBe('Kael has Vampire.');
  });

  it('should show a loading line while the catalog loads', () => {
    host.catalogLoading.set(true);
    fixture.detectChanges();

    expect(el.querySelector('.transformation-loading')).toBeTruthy();
  });

  it('should show a retry affordance when the catalog fails', () => {
    host.catalogError.set(true);
    fixture.detectChanges();

    expect(el.querySelector('.transformation-retry')).toBeTruthy();
  });

  it('should emit retryCatalog when the retry button is clicked', () => {
    host.catalogError.set(true);
    fixture.detectChanges();

    (el.querySelector('.transformation-retry') as HTMLButtonElement).click();

    expect(host.retried).toBe(true);
  });

  it('should disable the toggle while saving', () => {
    host.saving.set(true);
    fixture.detectChanges();

    expect(toggleButton().disabled).toBe(true);
  });

  it('should disable the select while saving', () => {
    host.saving.set(true);
    fixture.detectChanges();

    expect(select().disabled).toBe(true);
  });
});
