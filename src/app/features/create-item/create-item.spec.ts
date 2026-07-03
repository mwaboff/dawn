import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, HttpErrorResponse } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { By } from '@angular/platform-browser';
import { CreateItem } from './create-item';
import { AdminCardService } from '../../shared/services/admin-card.service';
import { AuthService } from '../../core/services/auth.service';
import { ItemForm } from '../../shared/components/item-form/item-form';
import { ItemTypeSelector } from './components/item-type-selector/item-type-selector';

const RAW_WEAPON = {
  id: 9,
  name: 'Custom Blade',
  description: 'A homemade sword',
  expansionId: 1,
  isOfficial: false,
  tier: 1,
  trait: 'AGILITY',
  range: 'MELEE',
  burden: 'ONE_HANDED',
  damage: { diceCount: 1, diceType: 'D8', modifier: 0, damageType: 'PHYSICAL' },
  cardType: 'weapon',
};

function makeActivatedRoute(params: Record<string, string> = {}) {
  return { snapshot: { params } };
}

describe('CreateItem', () => {
  let fixture: ComponentFixture<CreateItem>;
  let component: CreateItem;
  let adminCardService: AdminCardService;
  let authService: AuthService;
  let router: Router;

  function getItemForm(): ItemForm {
    return fixture.debugElement.query(By.directive(ItemForm)).componentInstance;
  }

  async function setup(routeParams: Record<string, string> = {}) {
    await TestBed.configureTestingModule({
      imports: [CreateItem],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: makeActivatedRoute(routeParams) },
      ],
    }).compileComponents();

    adminCardService = TestBed.inject(AdminCardService);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);

    fixture = TestBed.createComponent(CreateItem);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates the component', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  describe('create mode — type step', () => {
    it('renders the item type selector on the type step', async () => {
      await setup();
      expect(fixture.debugElement.query(By.directive(ItemTypeSelector))).toBeTruthy();
    });

    it('advances to the form step when a type is selected', async () => {
      await setup();
      const selector = fixture.debugElement.query(By.directive(ItemTypeSelector)).componentInstance as ItemTypeSelector;
      selector.typeSelected.emit('weapon');
      fixture.detectChanges();

      expect(component.step()).toBe('form');
      expect(component.itemType()).toBe('weapon');
      expect(fixture.debugElement.query(By.directive(ItemForm))).toBeTruthy();
    });

    it('returns to the type step when Back is clicked', async () => {
      await setup();
      component.onTypeSelected('armor');
      fixture.detectChanges();

      component.onBackToType();
      fixture.detectChanges();

      expect(component.step()).toBe('type');
      expect(component.itemType()).toBeNull();
    });
  });

  describe('create mode — saving', () => {
    it('POSTs the built payload via AdminCardService.createCard', async () => {
      await setup();
      component.onTypeSelected('weapon');
      fixture.detectChanges();
      const createSpy = vi.spyOn(adminCardService, 'createCard').mockReturnValue(of({ id: 1 }));

      component.onFormSaved({ name: 'New Sword' });

      expect(createSpy).toHaveBeenCalledWith('weapon', { name: 'New Sword' });
    });

    it('shows the success state after a successful create', async () => {
      await setup();
      component.onTypeSelected('weapon');
      vi.spyOn(adminCardService, 'createCard').mockReturnValue(of({ id: 1 }));

      component.onFormSaved({ name: 'New Sword' });

      expect(component.success()).toBe(true);
      expect(component.saving()).toBe(false);
    });

    it('resets to the type step when Create another is clicked', async () => {
      await setup();
      component.onTypeSelected('weapon');
      vi.spyOn(adminCardService, 'createCard').mockReturnValue(of({ id: 1 }));
      component.onFormSaved({ name: 'New Sword' });

      component.onCreateAnother();

      expect(component.success()).toBe(false);
      expect(component.step()).toBe('type');
      expect(component.itemType()).toBeNull();
    });

    it('navigates to reference with an isOfficial:false filter on View in Reference', async () => {
      await setup();
      const navigateSpy = vi.spyOn(router, 'navigate');

      component.onViewInReference();

      expect(navigateSpy).toHaveBeenCalledWith(['/reference'], {
        queryParams: { filters: JSON.stringify({ isOfficial: false }) },
      });
    });

    it('calls itemFormRef().requestSave() when the Save button handler runs', async () => {
      await setup();
      component.onTypeSelected('weapon');
      fixture.detectChanges();
      const itemForm = getItemForm();
      const requestSaveSpy = vi.spyOn(itemForm, 'requestSave');

      component.onSave();

      expect(requestSaveSpy).toHaveBeenCalled();
    });
  });

  describe('edit mode', () => {
    it('skips the type step and loads the item via AdminCardService.getCard', async () => {
      const getCardSpy = vi.fn().mockReturnValue(of(RAW_WEAPON));
      await TestBed.configureTestingModule({
        imports: [CreateItem],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          provideRouter([]),
          { provide: ActivatedRoute, useValue: makeActivatedRoute({ itemType: 'weapon', id: '9' }) },
        ],
      }).compileComponents();
      adminCardService = TestBed.inject(AdminCardService);
      vi.spyOn(adminCardService, 'getCard').mockImplementation(getCardSpy);

      fixture = TestBed.createComponent(CreateItem);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(getCardSpy).toHaveBeenCalledWith('weapon', 9);
      expect(component.step()).toBe('form');
      expect(component.isEditMode()).toBe(true);
      expect(fixture.debugElement.query(By.directive(ItemForm))).toBeTruthy();
    });

    it('PUTs via AdminCardService.updateCard and navigates to reference on success', async () => {
      await TestBed.configureTestingModule({
        imports: [CreateItem],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          provideRouter([]),
          { provide: ActivatedRoute, useValue: makeActivatedRoute({ itemType: 'weapon', id: '9' }) },
        ],
      }).compileComponents();
      adminCardService = TestBed.inject(AdminCardService);
      router = TestBed.inject(Router);
      vi.spyOn(adminCardService, 'getCard').mockReturnValue(of(RAW_WEAPON));
      const updateSpy = vi.spyOn(adminCardService, 'updateCard').mockReturnValue(of({ id: 9 }));
      const navigateSpy = vi.spyOn(router, 'navigate');

      fixture = TestBed.createComponent(CreateItem);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      component.onFormSaved({ name: 'Renamed Blade' });

      expect(updateSpy).toHaveBeenCalledWith('weapon', 9, { name: 'Renamed Blade' });
      expect(navigateSpy).toHaveBeenCalledWith(['/reference']);
    });
  });

  describe('error handling', () => {
    it('shows the backend message on a 429 (creation cap reached)', async () => {
      await setup();
      component.onTypeSelected('weapon');
      const error = new HttpErrorResponse({ status: 429, error: { message: 'Custom item limit reached.' } });
      vi.spyOn(adminCardService, 'createCard').mockReturnValue(throwError(() => error));

      component.onFormSaved({ name: 'New Sword' });

      expect(component.error()).toBe('Custom item limit reached.');
      expect(component.saving()).toBe(false);
    });

    it('shows a friendly message on a 403', async () => {
      await setup();
      component.onTypeSelected('weapon');
      const error = new HttpErrorResponse({ status: 403 });
      vi.spyOn(adminCardService, 'createCard').mockReturnValue(throwError(() => error));

      component.onFormSaved({ name: 'New Sword' });

      expect(component.error()).toBe('You do not have permission to perform this action.');
    });

    it('shows a generic message on other errors', async () => {
      await setup();
      component.onTypeSelected('weapon');
      const error = new HttpErrorResponse({ status: 500 });
      vi.spyOn(adminCardService, 'createCard').mockReturnValue(throwError(() => error));

      component.onFormSaved({ name: 'New Sword' });

      expect(component.error()).toBe('Something went wrong. Please try again.');
    });
  });

  describe('showIsOfficialField', () => {
    it('is true for admins', async () => {
      await setup();
      vi.spyOn(authService, 'isAdmin').mockReturnValue(true);
      expect(component.showIsOfficialField()).toBe(true);
    });

    it('is false for non-admins', async () => {
      await setup();
      vi.spyOn(authService, 'isAdmin').mockReturnValue(false);
      expect(component.showIsOfficialField()).toBe(false);
    });
  });
});
