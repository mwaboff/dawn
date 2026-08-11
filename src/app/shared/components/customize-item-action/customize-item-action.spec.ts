import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { CustomizeItemAction } from './customize-item-action';
import { AuthService } from '../../../core/services/auth.service';
import { WeaponService } from '../../services/weapon.service';
import { ArmorService } from '../../services/armor.service';
import { LootService } from '../../services/loot.service';
import { MappedSearchResult } from '../../mappers/search-result.mapper';
import { SearchableEntityType } from '../../models/search.model';
import { WeaponResponse } from '../../models/weapon-api.model';
import { ArmorResponse } from '../../models/armor-api.model';
import { LootApiResponse } from '../../models/loot-api.model';
import { UserResponse } from '../../../core/models/auth.model';

function makeResult(
  type: SearchableEntityType,
  id = 7,
  name = 'Broadsword',
  createdByUserId: number | null = null,
): MappedSearchResult {
  return {
    type,
    id,
    name,
    relevanceScore: 1,
    card: { id, name, description: 'desc', cardType: 'class', metadata: { createdByUserId } },
  };
}

function buildUser(id: number): UserResponse {
  return {
    id,
    username: 'tester',
    role: 'USER',
    createdAt: '',
    lastModifiedAt: '',
  } as UserResponse;
}

@Component({
  template: `<app-customize-item-action [result]="result" [variant]="variant" />`,
  imports: [CustomizeItemAction],
})
class HostComponent {
  result: MappedSearchResult = makeResult('WEAPON');
  variant: 'classic' | 'beta' = 'classic';
}

describe('CustomizeItemAction', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let authService: AuthService;
  let weaponService: WeaponService;
  let armorService: ArmorService;
  let lootService: LootService;
  let router: Router;
  let httpMock: HttpTestingController;

  function button(): HTMLButtonElement | null {
    return fixture.nativeElement.querySelector('button');
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    weaponService = TestBed.inject(WeaponService);
    armorService = TestBed.inject(ArmorService);
    lootService = TestBed.inject(LootService);
    router = TestBed.inject(Router);
    httpMock = TestBed.inject(HttpTestingController);
    vi.spyOn(authService, 'isLoggedIn').mockReturnValue(true);
    vi.spyOn(authService, 'user').mockReturnValue(buildUser(1));
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  // `variant` defaults to `'classic'` and is not set in any test in this describe block --
  // these are the component's original assertions, unchanged, pinning that the default rendering
  // (the full-text "Customize this item" button below the card) is untouched by the beta rework.
  describe('classic (default) — unchanged text button', () => {
    describe('visibility', () => {
      it('offers the action on a weapon result', () => {
        host.result = makeResult('WEAPON');
        fixture.detectChanges();

        expect(button()?.textContent?.trim()).toBe('Customize this item');
      });

      it('offers the action on an armor result', () => {
        host.result = makeResult('ARMOR');
        fixture.detectChanges();

        expect(button()).toBeTruthy();
      });

      it('offers the action on a loot result', () => {
        host.result = makeResult('LOOT');
        fixture.detectChanges();

        expect(button()).toBeTruthy();
      });

      it('renders nothing for a type with no item table behind it', () => {
        host.result = makeResult('ADVERSARY');
        fixture.detectChanges();

        expect(button()).toBeFalsy();
      });

      it('renders nothing when the reader is browsing the codex anonymously', () => {
        vi.spyOn(authService, 'isLoggedIn').mockReturnValue(false);
        host.result = makeResult('WEAPON');
        fixture.detectChanges();

        expect(button()).toBeFalsy();
      });

      it('names the item in the accessible label so repeated buttons stay distinguishable', () => {
        host.result = makeResult('WEAPON', 7, 'Hallowed Axe');
        fixture.detectChanges();

        expect(button()?.getAttribute('aria-label')).toBe('Customize Hallowed Axe');
      });

      it('never shows an Edit button, even for the viewer\'s own homebrew -- classic has no action row to put one in', () => {
        vi.spyOn(authService, 'user').mockReturnValue(buildUser(5));
        host.result = makeResult('WEAPON', 7, 'Broadsword', 5);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelectorAll('button').length).toBe(1);
      });
    });

    describe('copy dispatch', () => {
      it('copies a weapon and opens the builder on the new copy', () => {
        const copySpy = vi
          .spyOn(weaponService, 'copyWeapon')
          .mockReturnValue(of({ id: 42 } as WeaponResponse));
        const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
        host.result = makeResult('WEAPON', 7);
        fixture.detectChanges();

        button()?.click();

        expect(copySpy).toHaveBeenCalledWith(7);
        expect(navigateSpy).toHaveBeenCalledWith(['/items/weapon/42/edit']);
      });

      it('copies armor through the armor endpoint', () => {
        const copySpy = vi
          .spyOn(armorService, 'copyArmor')
          .mockReturnValue(of({ id: 9 } as ArmorResponse));
        const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
        host.result = makeResult('ARMOR', 3);
        fixture.detectChanges();

        button()?.click();

        expect(copySpy).toHaveBeenCalledWith(3);
        expect(navigateSpy).toHaveBeenCalledWith(['/items/armor/9/edit']);
      });

      it('copies loot through the loot endpoint', () => {
        const copySpy = vi
          .spyOn(lootService, 'copyLoot')
          .mockReturnValue(of({ id: 11 } as LootApiResponse));
        const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
        host.result = makeResult('LOOT', 5);
        fixture.detectChanges();

        button()?.click();

        expect(copySpy).toHaveBeenCalledWith(5);
        expect(navigateSpy).toHaveBeenCalledWith(['/items/loot/11/edit']);
      });
    });

    // `mapSearchResult` hands a WEAPON/ARMOR/LOOT result an empty "fallback" card when the backend
    // returned no `expandedEntity`, and that card reads as a styling bug -- right name, blank body.
    // The action is still correct there and must not be hidden: `result.id` is a real weapon id
    // whether or not the entity was expanded, so the copy succeeds and the user lands in the
    // builder on genuine data. Whoever meets a blank card next should fix the mapper, not this
    // button.
    describe('unexpanded results', () => {
      function makeFallbackResult(): MappedSearchResult {
        return {
          type: 'WEAPON',
          id: 7,
          name: 'Broadsword',
          relevanceScore: 1,
          card: { id: 7, name: 'Broadsword', description: '', cardType: 'class' },
        };
      }

      it('still offers the action when the card fell back to the empty shape', () => {
        host.result = makeFallbackResult();
        fixture.detectChanges();

        expect(button()).toBeTruthy();
      });

      it('copies the real item id even though the card body is empty', () => {
        const copySpy = vi
          .spyOn(weaponService, 'copyWeapon')
          .mockReturnValue(of({ id: 42 } as WeaponResponse));
        const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
        host.result = makeFallbackResult();
        fixture.detectChanges();

        button()?.click();

        expect(copySpy).toHaveBeenCalledWith(7);
        expect(navigateSpy).toHaveBeenCalledWith(['/items/weapon/42/edit']);
      });
    });

    describe('failure', () => {
      it('surfaces an alert and stays on the codex when the copy fails', () => {
        vi.spyOn(weaponService, 'copyWeapon').mockReturnValue(throwError(() => new Error('500')));
        const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
        host.result = makeResult('WEAPON', 7, 'Broadsword');
        fixture.detectChanges();

        button()?.click();
        fixture.detectChanges();

        expect(navigateSpy).not.toHaveBeenCalled();
        const alert = fixture.nativeElement.querySelector('[role="alert"]');
        expect(alert.textContent).toContain("Couldn't copy Broadsword");
      });

      it('re-enables the button after a failure so the copy can be retried', () => {
        vi.spyOn(weaponService, 'copyWeapon').mockReturnValue(throwError(() => new Error('500')));
        fixture.detectChanges();

        button()?.click();
        fixture.detectChanges();

        expect(button()?.disabled).toBe(false);
      });
    });

    describe('in flight', () => {
      it('disables the button while the copy is outstanding', () => {
        vi.spyOn(weaponService, 'copyWeapon').mockReturnValue(new Subject<WeaponResponse>());
        fixture.detectChanges();

        button()?.click();
        fixture.detectChanges();

        expect(button()?.disabled).toBe(true);
        expect(button()?.textContent?.trim()).toBe('Copying…');
      });

      // White-box on purpose: by this point the button is [disabled], so a second DOM click never
      // reaches the handler. The disabled binding is covered above; this pins the early return
      // that backs it up, which is why the name talks about onCustomize rather than about
      // clicking.
      it('onCustomize returns early while a copy is outstanding', () => {
        const copySpy = vi
          .spyOn(weaponService, 'copyWeapon')
          .mockReturnValue(new Subject<WeaponResponse>());
        fixture.detectChanges();

        button()?.click();
        fixture.detectChanges();
        const action = fixture.debugElement.query(By.directive(CustomizeItemAction));
        (action.componentInstance as CustomizeItemAction).onCustomize();

        expect(copySpy).toHaveBeenCalledTimes(1);
      });

      it('clears a previous failure when the copy is retried', () => {
        const copySpy = vi.spyOn(weaponService, 'copyWeapon');
        copySpy.mockReturnValueOnce(throwError(() => new Error('500')));
        copySpy.mockReturnValueOnce(of({ id: 42 } as WeaponResponse));
        vi.spyOn(router, 'navigate').mockResolvedValue(true);
        fixture.detectChanges();

        button()?.click();
        fixture.detectChanges();
        button()?.click();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeFalsy();
      });
    });
  });

  describe('beta variant — icon buttons', () => {
    function buttons(): HTMLButtonElement[] {
      return Array.from(fixture.nativeElement.querySelectorAll('button'));
    }

    function copyButton(): HTMLButtonElement | undefined {
      return buttons().find(b => b.getAttribute('aria-label')?.startsWith('Customize') || b.getAttribute('aria-label')?.startsWith('Copying'));
    }

    function editButton(): HTMLButtonElement | undefined {
      return buttons().find(b => b.getAttribute('aria-label')?.startsWith('Edit'));
    }

    beforeEach(() => {
      host.variant = 'beta';
    });

    it('renders the copy action as an icon-only button, not the classic text button', () => {
      host.result = makeResult('WEAPON');
      fixture.detectChanges();

      const btn = copyButton();
      expect(btn).toBeTruthy();
      expect(btn?.textContent?.trim()).toBe('');
      expect(btn?.classList).toContain('card-swap-btn');
      expect(btn?.classList).toContain('card-swap-btn--icon');
    });

    it('gives the copy button an inline SVG icon, hidden from assistive tech', () => {
      host.result = makeResult('WEAPON');
      fixture.detectChanges();

      const svg = copyButton()?.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute('aria-hidden')).toBe('true');
      expect(svg?.getAttribute('focusable')).toBe('false');
    });

    it('names the copy button in both aria-label and title, so sighted and assistive-tech users get the same name', () => {
      host.result = makeResult('WEAPON', 7, 'Hallowed Axe');
      fixture.detectChanges();

      const btn = copyButton();
      expect(btn?.getAttribute('aria-label')).toBe('Customize Hallowed Axe');
      expect(btn?.getAttribute('title')).toBe('Customize Hallowed Axe');
    });

    it('renders nothing when the reader is browsing the codex anonymously', () => {
      vi.spyOn(authService, 'isLoggedIn').mockReturnValue(false);
      host.result = makeResult('WEAPON');
      fixture.detectChanges();

      expect(copyButton()).toBeFalsy();
    });

    describe('Edit button visibility', () => {
      it('shows Edit when the viewer authored the item', () => {
        vi.spyOn(authService, 'user').mockReturnValue(buildUser(5));
        host.result = makeResult('WEAPON', 7, 'Broadsword', 5);
        fixture.detectChanges();

        expect(editButton()).toBeTruthy();
      });

      it('hides Edit for official content (no author)', () => {
        vi.spyOn(authService, 'user').mockReturnValue(buildUser(5));
        host.result = makeResult('WEAPON', 7, 'Broadsword', null);
        fixture.detectChanges();

        expect(editButton()).toBeFalsy();
      });

      it('hides Edit for someone else\'s homebrew', () => {
        vi.spyOn(authService, 'user').mockReturnValue(buildUser(5));
        host.result = makeResult('WEAPON', 7, 'Broadsword', 9);
        fixture.detectChanges();

        expect(editButton()).toBeFalsy();
      });

      it('still shows Copy alongside Edit for an owned item', () => {
        vi.spyOn(authService, 'user').mockReturnValue(buildUser(5));
        host.result = makeResult('WEAPON', 7, 'Broadsword', 5);
        fixture.detectChanges();

        expect(copyButton()).toBeTruthy();
        expect(editButton()).toBeTruthy();
      });

      it('gives Edit its own distinct icon from Copy -- not colour alone to tell them apart', () => {
        vi.spyOn(authService, 'user').mockReturnValue(buildUser(5));
        host.result = makeResult('WEAPON', 7, 'Broadsword', 5);
        fixture.detectChanges();

        const copySvg = copyButton()?.querySelector('svg')?.innerHTML;
        const editSvg = editButton()?.querySelector('svg')?.innerHTML;
        expect(copySvg).toBeTruthy();
        expect(editSvg).toBeTruthy();
        expect(copySvg).not.toBe(editSvg);
      });

      it('navigates directly to the edit page without copying when Edit is clicked', () => {
        const copySpy = vi.spyOn(weaponService, 'copyWeapon');
        const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
        vi.spyOn(authService, 'user').mockReturnValue(buildUser(5));
        host.result = makeResult('WEAPON', 7, 'Broadsword', 5);
        fixture.detectChanges();

        editButton()?.click();

        expect(copySpy).not.toHaveBeenCalled();
        expect(navigateSpy).toHaveBeenCalledWith(['/items/weapon/7/edit']);
      });

      it('never shows Edit when the result carries no card (e.g. the inventory rows\' lightweight result)', () => {
        vi.spyOn(authService, 'user').mockReturnValue(buildUser(5));
        host.result = { type: 'WEAPON', id: 7, name: 'Broadsword', relevanceScore: null };
        fixture.detectChanges();

        expect(editButton()).toBeFalsy();
        expect(copyButton()).toBeTruthy();
      });
    });

    describe('copy dispatch', () => {
      it('copies a weapon and opens the builder on the new copy', () => {
        const copySpy = vi
          .spyOn(weaponService, 'copyWeapon')
          .mockReturnValue(of({ id: 42 } as WeaponResponse));
        const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
        host.result = makeResult('WEAPON', 7);
        fixture.detectChanges();

        copyButton()?.click();

        expect(copySpy).toHaveBeenCalledWith(7);
        expect(navigateSpy).toHaveBeenCalledWith(['/items/weapon/42/edit']);
      });
    });

    describe('in flight and failure — communicated non-visually since the button is icon-only', () => {
      it('disables the button, sets aria-busy, and swaps the accessible label while the copy is outstanding', () => {
        vi.spyOn(weaponService, 'copyWeapon').mockReturnValue(new Subject<WeaponResponse>());
        host.result = makeResult('WEAPON', 7, 'Broadsword');
        fixture.detectChanges();

        copyButton()?.click();
        fixture.detectChanges();

        const btn = copyButton();
        expect(btn?.disabled).toBe(true);
        expect(btn?.getAttribute('aria-busy')).toBe('true');
        expect(btn?.getAttribute('aria-label')).toBe('Copying Broadsword…');
        expect(btn?.getAttribute('title')).toBe('Copying Broadsword…');
      });

      it('surfaces an alert and re-enables the button when the copy fails', () => {
        vi.spyOn(weaponService, 'copyWeapon').mockReturnValue(throwError(() => new Error('500')));
        host.result = makeResult('WEAPON', 7, 'Broadsword');
        fixture.detectChanges();

        copyButton()?.click();
        fixture.detectChanges();

        expect(copyButton()?.disabled).toBe(false);
        const alert = fixture.nativeElement.querySelector('[role="alert"]');
        expect(alert.textContent).toContain("Couldn't copy Broadsword");
      });
    });
  });
});
