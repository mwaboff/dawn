import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { EnvironmentPicker } from './environment-picker';
import { EnvironmentService } from '../../../../../shared/services/environment.service';
import { CardData } from '../../../../../shared/components/daggerheart-card/daggerheart-card.model';

function buildCard(overrides: Partial<CardData> = {}): CardData {
  return { id: 1, name: 'Collapsing Bridge', description: '', cardType: 'environment', ...overrides };
}

describe('EnvironmentPicker', () => {
  let fixture: ComponentFixture<EnvironmentPicker>;
  let component: EnvironmentPicker;
  let environmentService: EnvironmentService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [EnvironmentPicker] });
    fixture = TestBed.createComponent(EnvironmentPicker);
    component = fixture.componentInstance;
    environmentService = TestBed.inject(EnvironmentService);
  });

  it('loads environments on init', () => {
    vi.spyOn(environmentService, 'getEnvironmentsPaginated').mockReturnValue(
      of({ cards: [buildCard()], currentPage: 0, totalPages: 1, totalElements: 1 }),
    );

    fixture.detectChanges();

    expect(component.environments()).toHaveLength(1);
    expect(component.loading()).toBe(false);
  });

  it('sets error and clears loading when the request fails', () => {
    vi.spyOn(environmentService, 'getEnvironmentsPaginated').mockReturnValue(throwError(() => new Error('boom')));

    fixture.detectChanges();

    expect(component.error()).toBe(true);
    expect(component.loading()).toBe(false);
  });

  it('emits the full card when a new environment is selected', () => {
    vi.spyOn(environmentService, 'getEnvironmentsPaginated').mockReturnValue(
      of({ cards: [buildCard({ id: 9 })], currentPage: 0, totalPages: 1, totalElements: 1 }),
    );
    let emitted: CardData | undefined;
    component.environmentSelected.subscribe(card => (emitted = card));

    fixture.detectChanges();
    component.onCardSelected(buildCard({ id: 9 }));

    expect(emitted).toEqual(buildCard({ id: 9 }));
  });

  it('emits undefined when the already-selected environment is clicked again', () => {
    fixture.componentRef.setInput('selectedEnvironmentId', 9);
    vi.spyOn(environmentService, 'getEnvironmentsPaginated').mockReturnValue(
      of({ cards: [buildCard({ id: 9 })], currentPage: 0, totalPages: 1, totalElements: 1 }),
    );
    let emitted: CardData | undefined = { id: -1 } as unknown as CardData;
    component.environmentSelected.subscribe(card => (emitted = card));

    fixture.detectChanges();
    component.onCardSelected(buildCard({ id: 9 }));

    expect(emitted).toBeUndefined();
  });

  it('emits undefined and shows the clear button when an environment is selected', () => {
    fixture.componentRef.setInput('selectedEnvironmentId', 9);
    vi.spyOn(environmentService, 'getEnvironmentsPaginated').mockReturnValue(
      of({ cards: [buildCard({ id: 9 })], currentPage: 0, totalPages: 1, totalElements: 1 }),
    );
    let emitted: CardData | undefined = { id: -1 } as unknown as CardData;
    component.environmentSelected.subscribe(card => (emitted = card));

    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.env-picker__clear-btn')).toBeTruthy();

    component.onClear();

    expect(emitted).toBeUndefined();
  });
});
