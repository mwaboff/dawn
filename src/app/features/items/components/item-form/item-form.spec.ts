import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { CostTagLookupService } from '../../../../shared/services/cost-tag-lookup.service';
import { ItemKind } from '../../item-routes';
import { DEFAULT_ITEM_FORM_VALUE, ItemFormValue } from '../../models/item-form-value.model';
import { ItemForm } from './item-form';

function formValue(overrides: Partial<ItemFormValue> = {}): ItemFormValue {
  return { ...DEFAULT_ITEM_FORM_VALUE, name: 'Seed', ...overrides };
}

describe('ItemForm', () => {
  let fixture: ComponentFixture<ItemForm>;
  let component: ItemForm;

  /**
   * Note what is *not* provided here: no Router, no ActivatedRoute. If `ItemForm` ever injects
   * either, every test in this file fails -- which is the point. Phase 9 renders it in a modal.
   */
  function setup(): void {
    TestBed.configureTestingModule({
      imports: [ItemForm],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    vi.spyOn(TestBed.inject(CostTagLookupService), 'listFull').mockReturnValue(of([]));
    fixture = TestBed.createComponent(ItemForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function setInput(name: string, value: unknown): void {
    fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
  }

  function selectKind(kind: ItemKind): void {
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('#kind');
    select.value = kind;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function submit(): void {
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  function text(): string {
    return fixture.nativeElement.textContent as string;
  }

  it('creates without a router or an http-backed service of its own', () => {
    setup();
    expect(component).toBeTruthy();
  });

  describe('kind picker', () => {
    it('offers all three kinds when no kind is locked', () => {
      setup();
      const options = Array.from<HTMLOptionElement>(
        fixture.nativeElement.querySelectorAll('#kind option'),
      ).map(o => o.value);

      expect(options).toEqual(['weapon', 'armor', 'loot']);
    });

    it('hides the picker when a kind is locked', () => {
      setup();
      setInput('lockedKind', 'armor');

      expect(fixture.nativeElement.querySelector('#kind')).toBeNull();
    });

    it('shows the locked kind\'s fields', () => {
      setup();
      setInput('lockedKind', 'armor');

      expect(fixture.nativeElement.querySelector('app-armor-fields')).not.toBeNull();
      expect(fixture.nativeElement.querySelector('app-weapon-fields')).toBeNull();
    });

    it('starts on weapon fields', () => {
      setup();
      expect(fixture.nativeElement.querySelector('app-weapon-fields')).not.toBeNull();
    });

    it('swaps to armor fields when the kind changes', () => {
      setup();
      selectKind('armor');

      expect(fixture.nativeElement.querySelector('app-armor-fields')).not.toBeNull();
      expect(fixture.nativeElement.querySelector('app-weapon-fields')).toBeNull();
    });

    it('swaps to loot fields when the kind changes', () => {
      setup();
      selectKind('loot');

      expect(fixture.nativeElement.querySelector('app-loot-fields')).not.toBeNull();
    });

    it('keeps the name when switching kind, so nothing typed is lost', () => {
      setup();
      component.form.controls['name'].setValue('Keepsake');
      selectKind('loot');

      expect(component.form.controls['name'].value).toBe('Keepsake');
    });
  });

  describe('tier and rarity', () => {
    it('labels the field Tier for a weapon', () => {
      setup();
      expect(component.tierField().label).toBe('Tier');
    });

    it('labels the field Rarity for loot', () => {
      setup();
      selectKind('loot');

      expect(component.tierField().label).toBe('Rarity');
    });

    it('names the four loot rarities rather than numbering them', () => {
      setup();
      selectKind('loot');
      const options = Array.from<HTMLOptionElement>(
        fixture.nativeElement.querySelectorAll('#tier option'),
      ).map(o => o.textContent!.trim());

      expect(options).toEqual(['Common', 'Uncommon', 'Rare', 'Legendary']);
    });

    it('numbers the four tiers for gear', () => {
      setup();
      const options = Array.from<HTMLOptionElement>(
        fixture.nativeElement.querySelectorAll('#tier option'),
      ).map(o => o.textContent!.trim());

      expect(options).toEqual(['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4']);
    });
  });

  it('offers no sourcebook or expansion field for any kind', () => {
    setup();
    for (const kind of ['weapon', 'armor', 'loot'] as const) {
      selectKind(kind);
      expect(fixture.nativeElement.querySelector('#expansionId')).toBeNull();
      expect(text().toLowerCase()).not.toContain('sourcebook');
      expect(text().toLowerCase()).not.toContain('expansion');
    }
  });

  describe('hard validation', () => {
    it('refuses to submit without a name', () => {
      setup();
      const emitted = vi.fn();
      component.submitted.subscribe(emitted);

      submit();

      expect(emitted).not.toHaveBeenCalled();
    });

    it('reports the missing name once a save is attempted', () => {
      setup();
      submit();

      expect(text()).toContain('Name is required.');
    });

    it('refuses a name longer than 200 characters', () => {
      setup();
      component.form.controls['name'].setValue('x'.repeat(201));
      const emitted = vi.fn();
      component.submitted.subscribe(emitted);

      submit();

      expect(emitted).not.toHaveBeenCalled();
    });

    it('accepts a name of exactly 200 characters', () => {
      setup();
      component.form.controls['name'].setValue('x'.repeat(200));
      const emitted = vi.fn();
      component.submitted.subscribe(emitted);

      submit();

      expect(emitted).toHaveBeenCalled();
    });

    it('refuses armor whose severe threshold sits below its major threshold', () => {
      setup();
      selectKind('armor');
      component.form.patchValue({ name: 'Bad Plate', baseMajorThreshold: 10, baseSevereThreshold: 4 });
      const emitted = vi.fn();
      component.submitted.subscribe(emitted);

      submit();

      expect(emitted).not.toHaveBeenCalled();
      expect(text()).toContain('Severe Threshold must be at least the Major Threshold.');
    });

    it('accepts armor whose thresholds are equal', () => {
      setup();
      selectKind('armor');
      component.form.patchValue({ name: 'Even Plate', baseMajorThreshold: 8, baseSevereThreshold: 8 });
      const emitted = vi.fn();
      component.submitted.subscribe(emitted);

      submit();

      expect(emitted).toHaveBeenCalled();
    });

    it('does not let armor thresholds block a weapon save', () => {
      setup();
      selectKind('armor');
      component.form.patchValue({ baseMajorThreshold: 10, baseSevereThreshold: 4 });
      selectKind('weapon');
      component.form.controls['name'].setValue('Fine Blade');
      const emitted = vi.fn();
      component.submitted.subscribe(emitted);

      submit();

      expect(emitted).toHaveBeenCalled();
    });
  });

  describe('soft advisories', () => {
    it('warns when a primary weapon is far off the printed damage for its tier', () => {
      setup();
      component.form.patchValue({ name: 'Overkill', tier: '3', isPrimary: true, modifier: 40 });
      fixture.detectChanges();

      expect(text()).toContain('Tier 3 primaries in the books deal about +9.');
    });

    it('still submits an item the advisory complains about', () => {
      setup();
      component.form.patchValue({ name: 'Overkill', tier: '3', isPrimary: true, modifier: 40 });
      const emitted = vi.fn();
      component.submitted.subscribe(emitted);

      submit();

      expect(emitted).toHaveBeenCalled();
    });

    it('never disables the save button on account of an advisory', () => {
      setup();
      component.form.patchValue({ name: 'Overkill', tier: '3', modifier: 40 });
      fixture.detectChanges();

      const save: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(save.disabled).toBe(false);
    });

    it('warns about an armor score beyond anything published', () => {
      setup();
      selectKind('armor');
      component.form.patchValue({ name: 'Bulwark', baseScore: 20 });
      fixture.detectChanges();

      expect(text()).toContain('Armor Score above 12 exceeds anything published.');
    });

    it('stays quiet about a weapon at the printed baseline', () => {
      setup();
      component.form.patchValue({ name: 'Ordinary', tier: '2', isPrimary: true, modifier: 6 });
      fixture.detectChanges();

      expect(text()).not.toContain('in the books deal about');
    });
  });

  describe('submission', () => {
    it('emits the typed values, with numbers narrowed back from the DOM strings', () => {
      setup();
      let emitted: ItemFormValue | undefined;
      component.submitted.subscribe(v => (emitted = v));
      component.form.patchValue({ name: 'Sunblade', tier: '3', modifier: 9, diceType: 'D10' });

      submit();

      expect(emitted).toMatchObject({
        kind: 'weapon',
        name: 'Sunblade',
        tier: 3,
        modifier: 9,
        diceType: 'D10',
      });
      expect(typeof emitted!.tier).toBe('number');
    });

    it('emits the locked kind rather than whatever the hidden control holds', () => {
      setup();
      setInput('lockedKind', 'loot');
      let emitted: ItemFormValue | undefined;
      component.submitted.subscribe(v => (emitted = v));
      component.form.controls['name'].setValue('Charm');

      submit();

      expect(emitted!.kind).toBe('loot');
    });

    it('emits an empty feature list when none were added', () => {
      setup();
      let emitted: ItemFormValue | undefined;
      component.submitted.subscribe(v => (emitted = v));
      component.form.controls['name'].setValue('Plain');

      submit();

      expect(emitted!.features).toEqual([]);
    });

    it('emits cancelled when Cancel is pressed', () => {
      setup();
      const cancelled = vi.fn();
      component.cancelled.subscribe(cancelled);

      fixture.nativeElement.querySelector('button[type="button"].btn--secondary').click();

      expect(cancelled).toHaveBeenCalled();
    });
  });

  describe('sharing', () => {
    it('lists the campaigns it was given, without fetching any', () => {
      setup();
      setInput('campaignOptions', [{ id: 1, label: 'Nightfall' }, { id: 2, label: 'Sundered' }]);

      expect(text()).toContain('Nightfall');
      expect(text()).toContain('Sundered');
    });

    it('records the campaigns that were ticked', () => {
      setup();
      setInput('campaignOptions', [{ id: 4, label: 'Nightfall' }]);
      fixture.nativeElement.querySelector('app-entity-multi-select input[type="checkbox"]').click();

      expect(component.form.controls['campaignIds'].value).toEqual([4]);
    });

    it('hides the public toggle from users who cannot set it', () => {
      setup();
      expect(fixture.nativeElement.querySelector('#isPublic')).toBeNull();
    });

    it('shows the public toggle to users who can set it', () => {
      setup();
      setInput('canSetPublic', true);

      expect(fixture.nativeElement.querySelector('#isPublic')).not.toBeNull();
    });
  });

  describe('initial value', () => {
    it('seeds every shared field', () => {
      setup();
      setInput('initialValue', formValue({ name: 'Heirloom', tier: 4, campaignIds: [2] }));

      expect(component.form.controls['name'].value).toBe('Heirloom');
      expect(component.form.controls['tier'].value).toBe('4');
      expect(component.form.controls['campaignIds'].value).toEqual([2]);
    });

    it('seeds the kind, switching which fields are shown', () => {
      setup();
      setInput('initialValue', formValue({ kind: 'loot', description: 'Shiny.' }));

      expect(fixture.nativeElement.querySelector('app-loot-fields')).not.toBeNull();
      expect(component.form.controls['description'].value).toBe('Shiny.');
    });

    it('seeds the feature editor', () => {
      setup();
      setInput('initialValue', formValue({
        features: [{
          name: 'Whispers',
          description: 'It talks.',
          featureType: 'ITEM',
          expansionId: null,
          costTags: [],
          modifiers: [],
        }],
      }));

      expect(component.editorFeatures()).toHaveLength(1);
      expect(component.editorFeatures()[0].name).toBe('Whispers');
    });

    it('round-trips seeded features back out on submit', () => {
      setup();
      setInput('initialValue', formValue({
        features: [{
          name: 'Whispers',
          description: 'It talks.',
          featureType: 'ITEM',
          expansionId: null,
          costTags: [],
          modifiers: [],
        }],
      }));
      let emitted: ItemFormValue | undefined;
      component.submitted.subscribe(v => (emitted = v));

      submit();

      expect(emitted!.features).toEqual([{
        name: 'Whispers',
        description: 'It talks.',
        featureType: 'ITEM',
        expansionId: null,
        costTags: [],
        modifiers: [],
      }]);
    });

    it('drops a feature that was deleted, keeping the rest', () => {
      setup();
      setInput('initialValue', formValue({
        features: [
          { name: 'One', description: '', featureType: 'ITEM', expansionId: null, costTags: [], modifiers: [] },
          { name: 'Two', description: '', featureType: 'ITEM', expansionId: null, costTags: [], modifiers: [] },
        ],
      }));

      component.onFeatureDeleted(component.editorFeatures()[0].id);
      fixture.detectChanges();

      expect(component.editorFeatures().map(f => f.name)).toEqual(['Two']);
    });
  });

  describe('host-supplied actions', () => {
    /**
     * Reproduces how a modal hosts this form: the shell owns the button row, so the submit button
     * is a *sibling* of `app-item-form` and reaches the form only through `form="<id>"`. If that
     * association ever breaks, the modal has no way to save and this is what catches it.
     */
    @Component({
      imports: [ItemForm],
      template: `
        <app-item-form
          [formId]="formId()"
          [showActions]="false"
          [initialValue]="initialValue()"
          (submitted)="onSubmitted($event)"
        />
        <button type="submit" [attr.form]="formId()" class="host-submit">Create Item</button>
      `,
    })
    class HostActionsComponent {
      formId = signal('custom-item-form');
      initialValue = signal<ItemFormValue | null>(formValue());
      submissions: ItemFormValue[] = [];
      onSubmitted(value: ItemFormValue): void {
        this.submissions.push(value);
      }
    }

    let hostFixture: ComponentFixture<HostActionsComponent>;
    let host: HostActionsComponent;

    function setupHost(): void {
      TestBed.configureTestingModule({
        imports: [HostActionsComponent],
        providers: [provideHttpClient(), provideHttpClientTesting()],
      });
      vi.spyOn(TestBed.inject(CostTagLookupService), 'listFull').mockReturnValue(of([]));
      hostFixture = TestBed.createComponent(HostActionsComponent);
      host = hostFixture.componentInstance;
      hostFixture.detectChanges();
    }

    function hostForm(): HTMLFormElement {
      return hostFixture.nativeElement.querySelector('form');
    }

    it('renders no actions row of its own', () => {
      setupHost();
      expect(hostFixture.nativeElement.querySelector('.item-form__actions')).toBeNull();
    });

    it('puts the given formId on the form element', () => {
      setupHost();
      expect(hostForm().getAttribute('id')).toBe('custom-item-form');
    });

    it('associates the host button with the form across the component boundary', () => {
      setupHost();
      const button: HTMLButtonElement = hostFixture.nativeElement.querySelector('.host-submit');

      expect(button.form).toBe(hostForm());
    });

    it('submits when the host button is clicked', () => {
      setupHost();

      hostFixture.nativeElement.querySelector('.host-submit').click();

      expect(host.submissions).toHaveLength(1);
      expect(host.submissions[0].name).toBe('Seed');
    });

    it('still blocks an invalid submit driven from the host button', () => {
      setupHost();
      host.initialValue.set(formValue({ name: '' }));
      hostFixture.detectChanges();

      hostFixture.nativeElement.querySelector('.host-submit').click();

      expect(host.submissions).toEqual([]);
    });

    /**
     * `requestSubmit()` is the algorithm implicit submission (Enter in a text field) runs, and is
     * what jsdom implements -- it does not synthesise implicit submission from a keydown. So this
     * asserts the reachable half: the form submits through its own submit algorithm while the only
     * submit button lives outside the component.
     */
    it('submits via the form submit algorithm, so Enter in a field still saves', () => {
      setupHost();

      hostForm().requestSubmit();

      expect(host.submissions).toHaveLength(1);
    });
  });

  describe('own actions row', () => {
    it('renders by default, for the routed page that owns its buttons', () => {
      setup();
      expect(fixture.nativeElement.querySelector('.item-form__actions')).not.toBeNull();
    });

    it('defaults the form id, so a lone form on a page needs no configuration', () => {
      setup();
      expect(fixture.nativeElement.querySelector('form').getAttribute('id')).toBe('item-form');
    });
  });

  describe('busy state', () => {
    it('disables both buttons while submitting', () => {
      setup();
      setInput('submitting', true);
      const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('button');

      expect(Array.from(buttons).every(b => b.disabled)).toBe(true);
    });

    it('uses the caller\'s submit label when idle', () => {
      setup();
      setInput('submitLabel', 'Create Item');

      expect(fixture.nativeElement.querySelector('button[type="submit"]').textContent.trim())
        .toBe('Create Item');
    });

    it('shows the error message the caller passed in', () => {
      setup();
      setInput('errorMessage', 'Save failed. Please try again.');

      expect(fixture.nativeElement.querySelector('[role="alert"]').textContent)
        .toContain('Save failed. Please try again.');
    });

    it('shows no alert when there is no error', () => {
      setup();
      expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    });
  });
});
