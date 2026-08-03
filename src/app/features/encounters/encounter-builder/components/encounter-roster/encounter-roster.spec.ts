import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EncounterRoster } from './encounter-roster';
import { EncounterRosterInstance } from '../../models/encounter-roster-instance.model';
import { AdversaryCard } from '../../../../../shared/components/adversary-card/adversary-card';
import { CardData } from '../../../../../shared/components/daggerheart-card/daggerheart-card.model';

function buildInstance(overrides: Partial<EncounterRosterInstance> = {}): EncounterRosterInstance {
  return {
    localId: 'a',
    adversaryId: 1,
    adversary: { id: 1, name: 'Goblin Scout', tier: 1, adversaryType: 'MINION' },
    displayOrder: 0,
    ...overrides,
  };
}

describe('EncounterRoster', () => {
  let fixture: ComponentFixture<EncounterRoster>;
  let component: EncounterRoster;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [EncounterRoster] });
    fixture = TestBed.createComponent(EncounterRoster);
    component = fixture.componentInstance;
  });

  it('shows the empty state when there are no instances', () => {
    fixture.componentRef.setInput('instances', []);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.roster-panel__empty')).toBeTruthy();
  });

  it('renders one adversary card per instance', () => {
    fixture.componentRef.setInput('instances', [buildInstance({ localId: 'a' }), buildInstance({ localId: 'b' })]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('app-adversary-card')).toHaveLength(2);
  });

  it('emits removeInstance with the localId when the remove button is clicked', () => {
    fixture.componentRef.setInput('instances', [buildInstance({ localId: 'a' })]);
    fixture.detectChanges();
    let removed: string | undefined;
    component.removeInstance.subscribe(id => (removed = id));

    fixture.nativeElement.querySelector('.roster-panel__remove-btn').click();

    expect(removed).toBe('a');
  });

  it('emits retierInstance with the selected tier', () => {
    fixture.componentRef.setInput('instances', [buildInstance({ localId: 'a' })]);
    fixture.detectChanges();
    let event: { localId: string; tier: number | undefined } | undefined;
    component.retierInstance.subscribe(e => (event = e));

    component.onRetierChange('a', { target: { value: '3' } } as unknown as Event);

    expect(event).toEqual({ localId: 'a', tier: 3 });
  });

  it('emits retierInstance with undefined tier when cleared back to the printed tier', () => {
    let event: { localId: string; tier: number | undefined } | undefined;
    component.retierInstance.subscribe(e => (event = e));

    component.onRetierChange('a', { target: { value: '' } } as unknown as Event);

    expect(event).toEqual({ localId: 'a', tier: undefined });
  });

  it('emits labelChange with the typed nickname', () => {
    let event: { localId: string; label: string } | undefined;
    component.labelChange.subscribe(e => (event = e));

    component.onLabelInput('a', { target: { value: 'Archer A' } } as unknown as Event);

    expect(event).toEqual({ localId: 'a', label: 'Archer A' });
  });

  it('passes tierOverride as effectiveTier to the adversary card', () => {
    fixture.componentRef.setInput('instances', [buildInstance({ localId: 'a', tierOverride: 3 })]);
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('app-adversary-card');
    expect(card.textContent).toContain('Retiered from Tier 1');
  });

  it('uses the shared themed select for the retier control', () => {
    fixture.componentRef.setInput('instances', [buildInstance({ localId: 'a' })]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.roster-panel__retier-select').classList.contains('form-select')).toBe(true);
  });

  it('renders roster cards as collapsible and compact, so a long roster stays scannable', () => {
    fixture.componentRef.setInput('instances', [buildInstance({ localId: 'a' })]);
    fixture.detectChanges();

    const card = fixture.debugElement.query(sel => sel.componentInstance instanceof AdversaryCard).componentInstance as AdversaryCard;
    expect(card.collapsible()).toBe(true);
    expect(card.compact()).toBe(true);
  });

  it('keeps the nickname, retier, and remove controls reachable while the card is collapsed', () => {
    fixture.componentRef.setInput('instances', [buildInstance({ localId: 'a' })]);
    fixture.detectChanges();

    // Roster cards start collapsed (collapsible defaults to closed) -- these three controls are
    // projected as siblings of the collapse toggle, not gated behind it, so they must all still
    // be in the DOM without the GM expanding the card first.
    expect(fixture.nativeElement.querySelector('.roster-panel__label-input')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.roster-panel__retier-select')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.roster-panel__remove-btn')).toBeTruthy();
  });

  it('still shows Name, type badge, and tier while collapsed', () => {
    fixture.componentRef.setInput('instances', [buildInstance({ localId: 'a' })]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.adversary-card__name').textContent.trim()).toBe('Goblin Scout');
    expect(fixture.nativeElement.querySelector('.adversary-card__type-badge').textContent.trim()).toBe('MINION');
    expect(fixture.nativeElement.querySelector('.adversary-card__subtitle--secondary').textContent.trim()).toBe('Tier 1');
  });

  it('still allows expanding a roster card to see its full stat block', () => {
    fixture.componentRef.setInput('instances', [buildInstance({ localId: 'a' })]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.adversary-card__body')).toBeFalsy();

    const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('.adversary-card__toggle');
    toggle.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.adversary-card__body')).toBeTruthy();
  });

  describe('selectedEnvironment', () => {
    it('does not render an environment card when none is selected', () => {
      fixture.componentRef.setInput('instances', []);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.roster-panel__environment')).toBeFalsy();
    });

    it('renders the selected environment alongside the adversaries', () => {
      const environment: CardData = {
        id: 9,
        name: 'Collapsing Bridge',
        description: '',
        cardType: 'environment',
        subtitle: 'Traversal',
        subtitleSecondary: 'Tier 1',
      };
      fixture.componentRef.setInput('instances', [buildInstance({ localId: 'a' })]);
      fixture.componentRef.setInput('selectedEnvironment', environment);
      fixture.detectChanges();

      const card = fixture.nativeElement.querySelector('.roster-panel__environment');
      expect(card.textContent).toContain('Collapsing Bridge');
      expect(card.textContent).toContain('Tier 1');
    });

    it('does not feed the environment into any adversary-card count', () => {
      const environment: CardData = { id: 9, name: 'Collapsing Bridge', description: '', cardType: 'environment' };
      fixture.componentRef.setInput('instances', [buildInstance({ localId: 'a' })]);
      fixture.componentRef.setInput('selectedEnvironment', environment);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelectorAll('app-adversary-card')).toHaveLength(1);
    });
  });

  describe('justAddedId highlight', () => {
    it('highlights the instance matching justAddedId', () => {
      fixture.componentRef.setInput('instances', [buildInstance({ localId: 'a' }), buildInstance({ localId: 'b' })]);
      fixture.componentRef.setInput('justAddedId', 'b');
      fixture.detectChanges();

      const cards = Array.from<Element>(fixture.nativeElement.querySelectorAll('app-adversary-card'));
      expect(cards[0].classList.contains('roster-panel__item--added')).toBe(false);
      expect(cards[1].classList.contains('roster-panel__item--added')).toBe(true);
    });

    it('highlights nothing when justAddedId is unset', () => {
      fixture.componentRef.setInput('instances', [buildInstance({ localId: 'a' })]);
      fixture.detectChanges();

      const card = fixture.nativeElement.querySelector('app-adversary-card');
      expect(card.classList.contains('roster-panel__item--added')).toBe(false);
    });
  });
});
