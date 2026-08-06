import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthService } from '../../../../core/services/auth.service';
import { CampaignService } from '../../../../shared/services/campaign.service';
import { CostTagLookupService } from '../../../../shared/services/cost-tag-lookup.service';
import { PaginatedResponse } from '../../../../shared/models/api.model';
import { CampaignResponse } from '../../../../shared/models/campaign-api.model';
import { WeaponResponse } from '../../../../shared/models/weapon-api.model';
import { ItemForm } from '../../../items/components/item-form/item-form';
import { ItemKind } from '../../../items/item-routes';
import { ItemSubmit } from '../../../items/item-submit';
import { DEFAULT_ITEM_FORM_VALUE, ItemFormValue } from '../../../items/models/item-form-value.model';
import { ItemCreateModal, ItemCreatedEvent } from './item-create-modal';

function buildWeapon(overrides: Partial<WeaponResponse> = {}): WeaponResponse {
  return {
    id: 12,
    name: 'Hearthblade',
    expansionId: null,
    tier: 1,
    isOfficial: false,
    isPublic: false,
    isPrimary: true,
    trait: 'AGILITY',
    range: 'MELEE',
    burden: 'ONE_HANDED',
    damage: { diceCount: 1, diceType: 'D6', modifier: 0, damageType: 'PHYSICAL', notation: '1d6' },
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
  fixture: ComponentFixture<ItemCreateModal>;
  component: ItemCreateModal;
  itemSubmit: ItemSubmit;
  el: HTMLElement;
  created: ItemCreatedEvent[];
  dismissals: number;
}

function setup(
  kind: ItemKind = 'weapon',
  options: { isModerator?: boolean; campaigns?: PaginatedResponse<CampaignResponse> } = {},
): Harness {
  TestBed.configureTestingModule({
    imports: [ItemCreateModal],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: AuthService, useValue: { isModerator: signal(options.isModerator ?? false) } },
    ],
  });

  // FeatureEditor, rendered inside ItemForm, fetches cost tags on construction. Its own spec
  // covers that; stubbing it here keeps un-flushed requests out of every test in this file.
  vi.spyOn(TestBed.inject(CostTagLookupService), 'listFull').mockReturnValue(of([]));
  vi.spyOn(TestBed.inject(CampaignService), 'getMyCampaigns')
    .mockReturnValue(of(options.campaigns ?? campaignPage([])));

  const fixture = TestBed.createComponent(ItemCreateModal);
  fixture.componentRef.setInput('kind', kind);

  const created: ItemCreatedEvent[] = [];
  let dismissals = 0;
  fixture.componentInstance.created.subscribe(event => created.push(event));
  fixture.componentInstance.dismissed.subscribe(() => dismissals++);

  return {
    fixture,
    component: fixture.componentInstance,
    itemSubmit: TestBed.inject(ItemSubmit),
    el: fixture.nativeElement,
    created,
    get dismissals() {
      return dismissals;
    },
  };
}

function formValue(overrides: Partial<ItemFormValue> = {}): ItemFormValue {
  return { ...DEFAULT_ITEM_FORM_VALUE, name: 'Hearthblade', ...overrides };
}

describe('ItemCreateModal', () => {
  it('creates', () => {
    const { fixture, component } = setup();
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('names the dialog after the kind it was opened for', () => {
    const { fixture, component } = setup('armor');
    fixture.detectChanges();

    expect(component.title()).toBe('Create Your Own Armor');
    expect(fixture.nativeElement.querySelector('.dialog-title')?.textContent?.trim())
      .toBe('Create Your Own Armor');
  });

  it('locks the form to the kind, so the picker never appears', () => {
    const { fixture } = setup('loot');
    fixture.detectChanges();

    const form = fixture.debugElement.query(By.directive(ItemForm)).componentInstance as ItemForm;
    expect(form.lockedKind()).toBe('loot');
  });

  it('puts the buttons in the shell footer, not inside the scrolling body', () => {
    const { fixture, el } = setup();
    fixture.detectChanges();

    expect(el.querySelector('.item-form__actions')).toBeNull();
    expect(el.querySelector('.dialog-actions .dialog-btn--submit')?.textContent?.trim())
      .toBe('Create & Add');
    expect(el.querySelector('.dialog-actions .dialog-btn--cancel')).toBeTruthy();
  });

  it('associates the footer submit button with the form it sits outside of', () => {
    const { fixture, el } = setup();
    fixture.detectChanges();

    const button = el.querySelector<HTMLButtonElement>('.dialog-btn--submit')!;
    expect(button.form).toBe(el.querySelector('form'));
  });

  it('saves when the footer submit button is clicked', () => {
    const { fixture, el, itemSubmit } = setup('weapon');
    fixture.detectChanges();
    const create = vi.spyOn(itemSubmit, 'create').mockReturnValue(of(buildWeapon()));
    const form = fixture.debugElement.query(By.directive(ItemForm)).componentInstance as ItemForm;
    form.form.controls['name'].setValue('Hearthblade');
    fixture.detectChanges();

    el.querySelector<HTMLButtonElement>('.dialog-btn--submit')!.click();

    expect(create).toHaveBeenCalledTimes(1);
  });

  it('disables both buttons while a save is in flight', () => {
    const { fixture, el, component } = setup();
    fixture.detectChanges();
    component.saving.set(true);
    fixture.detectChanges();

    expect(el.querySelector<HTMLButtonElement>('.dialog-btn--submit')!.disabled).toBe(true);
    expect(el.querySelector<HTMLButtonElement>('.dialog-btn--cancel')!.disabled).toBe(true);
  });

  it('emits dismissed when the footer cancel button is clicked', () => {
    const harness = setup();
    harness.fixture.detectChanges();

    harness.el.querySelector<HTMLButtonElement>('.dialog-btn--cancel')!.click();

    expect(harness.dismissals).toBe(1);
  });

  it('supplies the campaigns the item may be shared with, minus the ended ones', () => {
    const { fixture, component } = setup('weapon', {
      campaigns: campaignPage([
        { id: 1, name: 'Finished', isEnded: true },
        { id: 2, name: 'Running', isEnded: false },
      ]),
    });
    fixture.detectChanges();

    expect(component.campaignOptions()).toEqual([{ id: 2, label: 'Running' }]);
  });

  it('withholds the public toggle from an ordinary player', () => {
    const { fixture, component } = setup('weapon');
    fixture.detectChanges();

    expect(component.canSetPublic()).toBe(false);
  });

  it('offers the public toggle to a moderator', () => {
    const { fixture, component } = setup('weapon', { isModerator: true });
    fixture.detectChanges();

    expect(component.canSetPublic()).toBe(true);
  });

  it('posts the mapped payload for the locked kind', () => {
    const { fixture, component, itemSubmit } = setup('weapon');
    fixture.detectChanges();
    const create = vi.spyOn(itemSubmit, 'create').mockReturnValue(of(buildWeapon()));

    component.onSubmitted(formValue({ name: 'Hearthblade', tier: 2 }));

    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0]).toBe('weapon');
    expect(create.mock.calls[0][1]).toMatchObject({ name: 'Hearthblade', tier: 2 });
  });

  it('sends the locked kind even when the form value disagrees', () => {
    const { fixture, component, itemSubmit } = setup('armor');
    fixture.detectChanges();
    const create = vi.spyOn(itemSubmit, 'create').mockReturnValue(of(buildWeapon()));

    component.onSubmitted(formValue({ kind: 'weapon', baseScore: 4 }));

    expect(create.mock.calls[0][0]).toBe('armor');
    expect(create.mock.calls[0][1]).toMatchObject({ baseScore: 4 });
  });

  it('emits the created item with its kind, ready for the inventory insert', () => {
    const { fixture, component, itemSubmit, created } = setup('weapon');
    fixture.detectChanges();
    const weapon = buildWeapon({ id: 99 });
    vi.spyOn(itemSubmit, 'create').mockReturnValue(of(weapon));

    component.onSubmitted(formValue());

    expect(created).toEqual([{ type: 'weapon', item: weapon }]);
    expect(component.saving()).toBe(false);
  });

  it('stays open with the backend message when the save fails', () => {
    const { fixture, component, itemSubmit, created } = setup('weapon');
    fixture.detectChanges();
    vi.spyOn(itemSubmit, 'create').mockReturnValue(
      throwError(() => ({ error: { fieldErrors: { name: 'must not be blank' } } })),
    );

    component.onSubmitted(formValue());

    expect(component.saveError()).toBe('name: must not be blank');
    expect(component.saving()).toBe(false);
    expect(created).toEqual([]);
  });

  it('clears a previous error when the next save starts', () => {
    const { fixture, component, itemSubmit } = setup('weapon');
    fixture.detectChanges();
    component.saveError.set('name: must not be blank');
    vi.spyOn(itemSubmit, 'create').mockReturnValue(of(buildWeapon()));

    component.onSubmitted(formValue());

    expect(component.saveError()).toBeNull();
  });

  it('emits dismissed when the form is cancelled', () => {
    const harness = setup('weapon');
    harness.fixture.detectChanges();

    harness.component.onDismiss();

    expect(harness.dismissals).toBe(1);
  });

  it('refuses to dismiss while a save is in flight', () => {
    const harness = setup('weapon');
    harness.fixture.detectChanges();
    harness.component.saving.set(true);

    harness.component.onDismiss();

    expect(harness.dismissals).toBe(0);
  });
});
