import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthService } from '../../../core/services/auth.service';
import { CampaignService } from '../../../shared/services/campaign.service';
import { CostTagLookupService } from '../../../shared/services/cost-tag-lookup.service';
import { PaginatedResponse } from '../../../shared/models/api.model';
import { CampaignResponse } from '../../../shared/models/campaign-api.model';
import { WeaponResponse } from '../../../shared/models/weapon-api.model';
import { DEFAULT_ITEM_FORM_VALUE, ItemFormValue } from '../models/item-form-value.model';
import { ItemSubmit } from '../item-submit';
import { ItemForm } from '../components/item-form/item-form';
import { ItemBuilder } from './item-builder';

function buildWeapon(overrides: Partial<WeaponResponse> = {}): WeaponResponse {
  return {
    id: 7,
    name: 'Hearthblade',
    expansionId: null,
    tier: 2,
    isOfficial: false,
    isPublic: false,
    isPrimary: true,
    trait: 'FINESSE',
    range: 'CLOSE',
    burden: 'ONE_HANDED',
    damage: { diceCount: 1, diceType: 'D10', modifier: 6, damageType: 'MAGIC', notation: '1d10+6' },
    createdAt: '2026-01-01T00:00:00',
    lastModifiedAt: '2026-01-01T00:00:00',
    ...overrides,
  };
}

function campaignPage(
  campaigns: { id: number; name: string; isEnded?: boolean }[],
): PaginatedResponse<CampaignResponse> {
  return {
    content: campaigns as CampaignResponse[],
    currentPage: 0,
    pageSize: 100,
    totalElements: campaigns.length,
    totalPages: 1,
  };
}

interface Harness {
  fixture: ComponentFixture<ItemBuilder>;
  component: ItemBuilder;
  itemSubmit: ItemSubmit;
  router: Router;
}

function setup(params: Record<string, string> = {}, isModerator = false): Harness {
  TestBed.configureTestingModule({
    imports: [ItemBuilder],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([]),
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(params) } } },
      { provide: AuthService, useValue: { isModerator: signal(isModerator) } },
    ],
  });

  // FeatureEditor, rendered inside ItemForm, fetches cost tags on construction. Its own spec
  // covers that; stubbing it here keeps un-flushed requests out of every test in this file.
  vi.spyOn(TestBed.inject(CostTagLookupService), 'listFull').mockReturnValue(of([]));
  vi.spyOn(TestBed.inject(CampaignService), 'getMyCampaigns').mockReturnValue(of(campaignPage([])));

  const fixture = TestBed.createComponent(ItemBuilder);
  return {
    fixture,
    component: fixture.componentInstance,
    itemSubmit: TestBed.inject(ItemSubmit),
    router: TestBed.inject(Router),
  };
}

function formValue(overrides: Partial<ItemFormValue> = {}): ItemFormValue {
  return { ...DEFAULT_ITEM_FORM_VALUE, name: 'Sunblade', ...overrides };
}

describe('ItemBuilder', () => {
  describe('create mode', () => {
    it('creates', () => {
      const { fixture, component } = setup();
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });

    it('fetches nothing when there is no id in the route', () => {
      const { fixture, itemSubmit } = setup();
      const load = vi.spyOn(itemSubmit, 'load');
      fixture.detectChanges();

      expect(load).not.toHaveBeenCalled();
    });

    it('leaves the kind unlocked so the picker shows', () => {
      const { fixture, component } = setup();
      fixture.detectChanges();

      expect(component.lockedKind()).toBeNull();
    });

    it('labels the action as a creation', () => {
      const { fixture, component } = setup();
      fixture.detectChanges();

      expect(component.submitLabel()).toBe('Create Item');
      expect(component.heading()).toBe('Create an Item');
    });

    it('posts the mapped payload for the chosen kind', () => {
      const { fixture, component, itemSubmit } = setup();
      const create = vi.spyOn(itemSubmit, 'create').mockReturnValue(of(buildWeapon()));
      fixture.detectChanges();

      component.onSubmitted(formValue({ kind: 'weapon', tier: 2, modifier: 6, diceType: 'D10' }));

      expect(create).toHaveBeenCalledWith('weapon', expect.objectContaining({
        name: 'Sunblade',
        tier: 2,
        damage: { diceType: 'D10', modifier: 6, damageType: 'PHYSICAL' },
      }));
    });

    it('redirects to the edit URL for the new item, replacing the create URL', () => {
      const { fixture, component, itemSubmit, router } = setup();
      vi.spyOn(itemSubmit, 'create').mockReturnValue(of(buildWeapon({ id: 42 })));
      const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      fixture.detectChanges();

      component.onSubmitted(formValue());

      expect(navigate).toHaveBeenCalledWith(['/items/weapon/42/edit'], { replaceUrl: true });
    });

    it('keeps the kind in the redirect URL, because ids collide across the three tables', () => {
      const { fixture, component, itemSubmit, router } = setup();
      vi.spyOn(itemSubmit, 'create').mockReturnValue(of({ id: 42, name: 'Charm' }));
      const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      fixture.detectChanges();

      component.onSubmitted(formValue({ kind: 'loot' }));

      expect(navigate).toHaveBeenCalledWith(['/items/loot/42/edit'], { replaceUrl: true });
    });

    it('becomes an edit once the item exists', () => {
      const { fixture, component, itemSubmit, router } = setup();
      vi.spyOn(itemSubmit, 'create').mockReturnValue(of(buildWeapon({ id: 42 })));
      vi.spyOn(router, 'navigate').mockResolvedValue(true);
      fixture.detectChanges();

      component.onSubmitted(formValue());

      expect(component.isEdit()).toBe(true);
      expect(component.submitLabel()).toBe('Save Changes');
    });
  });

  describe('edit mode', () => {
    it('loads the item named by the route', () => {
      const { fixture, itemSubmit } = setup({ type: 'weapon', id: '7' });
      const load = vi.spyOn(itemSubmit, 'load').mockReturnValue(of(buildWeapon()));
      fixture.detectChanges();

      expect(load).toHaveBeenCalledWith('weapon', 7);
    });

    it('locks the kind to the one in the URL', () => {
      const { fixture, component, itemSubmit } = setup({ type: 'armor', id: '3' });
      vi.spyOn(itemSubmit, 'load').mockReturnValue(of({
        id: 3,
        name: 'Ringmail',
        expansionId: null,
        tier: 1,
        isOfficial: false,
        isPublic: false,
        baseMajorThreshold: 5,
        baseSevereThreshold: 11,
        baseScore: 4,
        createdAt: '',
        lastModifiedAt: '',
      }));
      fixture.detectChanges();

      expect(component.lockedKind()).toBe('armor');
    });

    it('seeds the form from the loaded item', () => {
      const { fixture, component, itemSubmit } = setup({ type: 'weapon', id: '7' });
      vi.spyOn(itemSubmit, 'load').mockReturnValue(of(buildWeapon()));
      fixture.detectChanges();

      expect(component.initialValue()).toMatchObject({ name: 'Hearthblade', tier: 2, modifier: 6 });
    });

    it('labels the action as an edit', () => {
      const { fixture, component, itemSubmit } = setup({ type: 'weapon', id: '7' });
      vi.spyOn(itemSubmit, 'load').mockReturnValue(of(buildWeapon()));
      fixture.detectChanges();

      expect(component.submitLabel()).toBe('Save Changes');
      expect(component.heading()).toBe('Edit Item');
    });

    it('PUTs to the loaded id and does not navigate away', () => {
      const { fixture, component, itemSubmit, router } = setup({ type: 'weapon', id: '7' });
      vi.spyOn(itemSubmit, 'load').mockReturnValue(of(buildWeapon()));
      const update = vi.spyOn(itemSubmit, 'update').mockReturnValue(of(buildWeapon()));
      const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      fixture.detectChanges();

      component.onSubmitted(formValue({ name: 'Renamed' }));

      expect(update).toHaveBeenCalledWith('weapon', 7, expect.objectContaining({ name: 'Renamed' }));
      expect(navigate).not.toHaveBeenCalled();
    });

    it('reports a load failure rather than showing an empty form', () => {
      const { fixture, component, itemSubmit } = setup({ type: 'weapon', id: '7' });
      vi.spyOn(itemSubmit, 'load').mockReturnValue(throwError(() => new Error('boom')));
      fixture.detectChanges();

      expect(component.loadError()).toBe(true);
      expect(fixture.nativeElement.querySelector('app-item-form')).toBeNull();
    });

    it('rejects a kind the URL made up, instead of guessing one', () => {
      const { fixture, component, itemSubmit } = setup({ type: 'sandwich', id: '7' });
      const load = vi.spyOn(itemSubmit, 'load');
      fixture.detectChanges();

      expect(component.loadError()).toBe(true);
      expect(load).not.toHaveBeenCalled();
    });
  });

  describe('save errors', () => {
    it('shows the message the server sent', () => {
      const { fixture, component, itemSubmit } = setup();
      vi.spyOn(itemSubmit, 'create').mockReturnValue(
        throwError(() => ({ error: { message: 'Name already taken.' } })),
      );
      fixture.detectChanges();

      component.onSubmitted(formValue());

      expect(component.saveError()).toBe('Name already taken.');
      expect(component.saving()).toBe(false);
    });

    it('spells out per-field validation errors, which arrive with no top-level message', () => {
      const { fixture, component, itemSubmit } = setup();
      vi.spyOn(itemSubmit, 'create').mockReturnValue(
        throwError(() => ({ error: { fieldErrors: { baseSevereThreshold: 'must not be null' } } })),
      );
      fixture.detectChanges();

      component.onSubmitted(formValue());

      expect(component.saveError()).toBe('baseSevereThreshold: must not be null');
    });

    it('joins multiple field errors rather than showing only the first', () => {
      const { fixture, component, itemSubmit } = setup();
      vi.spyOn(itemSubmit, 'create').mockReturnValue(
        throwError(() => ({ error: { fieldErrors: { name: 'must not be blank', tier: 'must be at most 4' } } })),
      );
      fixture.detectChanges();

      component.onSubmitted(formValue());

      expect(component.saveError()).toBe('name: must not be blank; tier: must be at most 4');
    });

    it('prefers field errors over a generic top-level message', () => {
      const { fixture, component, itemSubmit } = setup();
      vi.spyOn(itemSubmit, 'create').mockReturnValue(
        throwError(() => ({ error: { message: 'Validation failed', fieldErrors: { name: 'must not be blank' } } })),
      );
      fixture.detectChanges();

      component.onSubmitted(formValue());

      expect(component.saveError()).toBe('name: must not be blank');
    });

    it('ignores an empty fieldErrors object and uses the message', () => {
      const { fixture, component, itemSubmit } = setup();
      vi.spyOn(itemSubmit, 'create').mockReturnValue(
        throwError(() => ({ error: { message: 'Name already taken.', fieldErrors: {} } })),
      );
      fixture.detectChanges();

      component.onSubmitted(formValue());

      expect(component.saveError()).toBe('Name already taken.');
    });

    it('falls back to a generic message when the server sent none', () => {
      const { fixture, component, itemSubmit } = setup();
      vi.spyOn(itemSubmit, 'create').mockReturnValue(throwError(() => new Error('offline')));
      fixture.detectChanges();

      component.onSubmitted(formValue());

      expect(component.saveError()).toBe('Save failed. Please try again.');
    });

    it('clears a previous error when a retry succeeds', () => {
      const { fixture, component, itemSubmit, router } = setup();
      const create = vi.spyOn(itemSubmit, 'create')
        .mockReturnValueOnce(throwError(() => new Error('offline')));
      vi.spyOn(router, 'navigate').mockResolvedValue(true);
      fixture.detectChanges();
      component.onSubmitted(formValue());

      create.mockReturnValue(of(buildWeapon()));
      component.onSubmitted(formValue());

      expect(component.saveError()).toBeNull();
    });
  });

  describe('campaign options', () => {
    it('offers the campaigns the signed-in user belongs to', () => {
      const { fixture, component } = setup();
      vi.spyOn(TestBed.inject(CampaignService), 'getMyCampaigns').mockReturnValue(
        of(campaignPage([{ id: 1, name: 'Nightfall' }, { id: 2, name: 'Sundered Coast' }])),
      );
      fixture.detectChanges();

      expect(component.campaignOptions()).toEqual([
        { id: 1, label: 'Nightfall' },
        { id: 2, label: 'Sundered Coast' },
      ]);
    });

    it('leaves ended campaigns out of the picker', () => {
      const { fixture, component } = setup();
      vi.spyOn(TestBed.inject(CampaignService), 'getMyCampaigns').mockReturnValue(
        of(campaignPage([
          { id: 1, name: 'Nightfall' },
          { id: 2, name: 'Finished Business', isEnded: true },
        ])),
      );
      fixture.detectChanges();

      expect(component.campaignOptions()).toEqual([{ id: 1, label: 'Nightfall' }]);
    });

    it('carries on with no campaigns when the fetch fails, since sharing is optional', () => {
      const { fixture, component } = setup();
      vi.spyOn(TestBed.inject(CampaignService), 'getMyCampaigns').mockReturnValue(
        throwError(() => new Error('offline')),
      );
      fixture.detectChanges();

      expect(component.campaignOptions()).toEqual([]);
      expect(component.loadError()).toBe(false);
    });
  });

  describe('public toggle', () => {
    it('is withheld from ordinary users', () => {
      const { fixture, component } = setup({}, false);
      fixture.detectChanges();

      expect(component.canSetPublic()).toBe(false);
    });

    it('is offered to moderators', () => {
      const { fixture, component } = setup({}, true);
      fixture.detectChanges();

      expect(component.canSetPublic()).toBe(true);
    });
  });

  /**
   * Every other save test calls `onSubmitted` directly, which leaves the template binding that
   * reaches it untested -- deleting `(submitted)` from item-builder.html failed no test at all, so
   * the page could ship unable to save anything with a green suite. This drives the child's output
   * instead, so the wiring itself is what fails if it goes missing.
   */
  it('saves when the rendered form emits, not just when the handler is called', () => {
    const { fixture, itemSubmit } = setup();
    const create = vi.spyOn(itemSubmit, 'create').mockReturnValue(of(buildWeapon()));
    fixture.detectChanges();

    const form = fixture.debugElement.query(By.directive(ItemForm));
    expect(form).not.toBeNull();
    form.componentInstance.submitted.emit(formValue());
    fixture.detectChanges();

    expect(create).toHaveBeenCalledTimes(1);
  });
});
