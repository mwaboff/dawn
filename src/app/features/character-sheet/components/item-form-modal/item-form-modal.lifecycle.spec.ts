import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthService } from '../../../../core/services/auth.service';
import { CampaignService } from '../../../../shared/services/campaign.service';
import { CostTagLookupService } from '../../../../shared/services/cost-tag-lookup.service';
import { ItemFormModal } from './item-form-modal';
import { ItemSubmit } from '../../../items/item-submit';
import { ItemKind } from '../../../../shared/utils/item-routes.utils';

/** Mirrors `character-sheet.html`'s gate exactly: `@if (creatingItemKind(); as kind)`. */
@Component({
  template: `@if (kind(); as k) {
    <app-item-form-modal [kind]="k" />
  }`,
  imports: [ItemFormModal],
})
class SheetLikeHost {
  readonly kind = signal<ItemKind | null>(null);
}

describe('ItemFormModal lifecycle on the character sheet', () => {
  /**
   * The modal locks body scroll while open, and `document.body` is shared across every spec in the
   * run. A test that leaves it locked fails an unrelated file (`refine-sheet` asserts it restores
   * body scroll), so reset it here rather than relying on each test closing cleanly.
   */
  afterEach(() => {
    document.body.style.overflow = '';
  });

  function setup() {
    TestBed.configureTestingModule({
      imports: [SheetLikeHost],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { isModerator: signal(false) } },
      ],
    });
    vi.spyOn(TestBed.inject(CostTagLookupService), 'listFull').mockReturnValue(of([]));
    vi.spyOn(TestBed.inject(CampaignService), 'getMyCampaigns').mockReturnValue(
      of({ content: [], currentPage: 0, pageSize: 100, totalElements: 0, totalPages: 1 }),
    );
    const fixture = TestBed.createComponent(SheetLikeHost);
    fixture.detectChanges();
    return { fixture, host: fixture.componentInstance, el: fixture.nativeElement as HTMLElement };
  }

  function nameInput(el: HTMLElement): HTMLInputElement {
    return el.querySelector('#name') as HTMLInputElement;
  }

  it('renders no modal until the kind signal is set', () => {
    const { el } = setup();
    expect(el.querySelector('app-item-form-modal')).toBeNull();
  });

  it('drops a half-typed name when the modal is closed and re-opened', () => {
    const { fixture, host, el } = setup();

    host.kind.set('weapon');
    fixture.detectChanges();
    const input = nameInput(el);
    input.value = 'Half Typed Sword';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(nameInput(el).value).toBe('Half Typed Sword');

    host.kind.set(null);
    fixture.detectChanges();
    expect(el.querySelector('app-item-form-modal')).toBeNull();

    host.kind.set('weapon');
    fixture.detectChanges();

    expect(nameInput(el).value).toBe('');
  });

  it('drops a previous save error when the modal is closed and re-opened', () => {
    const { fixture, host, el } = setup();
    vi.spyOn(TestBed.inject(ItemSubmit), 'create').mockReturnValue(
      throwError(() => ({ error: { fieldErrors: { name: 'must not be blank' } } })),
    );

    host.kind.set('weapon');
    fixture.detectChanges();
    const input = nameInput(el);
    input.value = 'Doomed';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    el.querySelector<HTMLFormElement>('form')!.requestSubmit();
    fixture.detectChanges();
    expect(el.querySelector('.form-error')?.textContent).toContain('must not be blank');

    host.kind.set(null);
    fixture.detectChanges();
    host.kind.set('weapon');
    fixture.detectChanges();

    expect(el.querySelector('.form-error')).toBeNull();
  });

  it('re-opens on the new kind, not the one it was last opened with', () => {
    const { fixture, host, el } = setup();

    host.kind.set('weapon');
    fixture.detectChanges();
    expect(el.querySelector('app-weapon-fields')).not.toBeNull();

    host.kind.set(null);
    fixture.detectChanges();
    host.kind.set('armor');
    fixture.detectChanges();

    expect(el.querySelector('app-armor-fields')).not.toBeNull();
    expect(el.querySelector('app-weapon-fields')).toBeNull();
  });

  it('re-enables the submit button after a failed save so a retry is possible', () => {
    const { fixture, host, el } = setup();
    vi.spyOn(TestBed.inject(ItemSubmit), 'create').mockReturnValue(
      throwError(() => ({ error: { message: 'boom' } })),
    );

    host.kind.set('weapon');
    fixture.detectChanges();
    const input = nameInput(el);
    input.value = 'Retryable';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    el.querySelector<HTMLFormElement>('form')!.requestSubmit();
    fixture.detectChanges();

    expect(el.querySelector<HTMLButtonElement>('.dialog-btn--submit')!.disabled).toBe(false);
    expect(el.querySelector('.form-error')?.getAttribute('role')).toBe('alert');
  });

  it('locks body scroll while open and restores it on close', () => {
    const { fixture, host } = setup();

    host.kind.set('weapon');
    fixture.detectChanges();
    expect(document.body.style.overflow).toBe('hidden');

    host.kind.set(null);
    fixture.detectChanges();
    expect(document.body.style.overflow).toBe('');
  });
});
