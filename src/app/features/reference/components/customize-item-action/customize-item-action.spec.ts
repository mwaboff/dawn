import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { CustomizeItemAction } from './customize-item-action';
import { AuthService } from '../../../../core/services/auth.service';
import { WeaponService } from '../../../../shared/services/weapon.service';
import { ArmorService } from '../../../../shared/services/armor.service';
import { LootService } from '../../../../shared/services/loot.service';
import { MappedSearchResult } from '../../../../shared/mappers/search-result.mapper';
import { SearchableEntityType } from '../../../../shared/models/search.model';
import { WeaponResponse } from '../../../../shared/models/weapon-api.model';
import { ArmorResponse } from '../../../../shared/models/armor-api.model';
import { LootApiResponse } from '../../../../shared/models/loot-api.model';

function makeResult(type: SearchableEntityType, id = 7, name = 'Broadsword'): MappedSearchResult {
  return {
    type,
    id,
    name,
    relevanceScore: 1,
    card: { id, name, description: 'desc', cardType: 'class' },
  };
}

@Component({
  template: `<app-customize-item-action [result]="result" />`,
  imports: [CustomizeItemAction],
})
class HostComponent {
  result: MappedSearchResult = makeResult('WEAPON');
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
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

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
  // whether or not the entity was expanded, so the copy succeeds and the user lands in the builder
  // on genuine data. Whoever meets a blank card next should fix the mapper, not this button.
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
    // reaches the handler. The disabled binding is covered above; this pins the early return that
    // backs it up, which is why the name talks about onCustomize rather than about clicking.
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
