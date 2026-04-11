import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CardEdit } from './card-edit';
import { AdminCardService } from '../../../shared/services/admin-card.service';
import { AdminLookupService } from './services/admin-lookup.service';
import { CARD_EDIT_SCHEMAS } from './schema/card-edit-schema';
import { By } from '@angular/platform-browser';

const DOMAIN_CARD_RAW = {
  id: 5,
  name: 'Blazing Strike',
  description: 'A fiery attack',
  expansionId: 1,
  associatedDomainId: 2,
  level: 3,
  recallCost: 1,
  type: 'SPELL',
  isOfficial: false,
  backgroundImageUrl: null,
  cardType: 'domainCard',
  features: [],
};

const CLASS_CARD_RAW = {
  id: 1,
  name: 'Test Card',
  description: 'A test',
  expansionId: 1,
  startingEvasion: 8,
  startingHitPoints: 6,
  startingClassItems: '',
  associatedDomainIds: [],
  hopeFeatureIds: [],
  classFeatureIds: [],
  cardType: 'class',
  features: [
    {
      id: 10,
      name: 'Feature A',
      description: 'Desc A',
      featureType: 'CLASS',
      expansionId: 1,
      costTagIds: [],
      modifierIds: [],
      costTags: [],
      modifiers: [],
    },
  ],
};

function makeActivatedRoute(cardType: string, id = '1') {
  return { snapshot: { params: { cardType, id } } };
}

describe('CardEdit — schema-driven orchestrator', () => {
  let fixture: ComponentFixture<CardEdit>;
  let component: CardEdit;
  let adminCardService: AdminCardService;
  let adminLookupService: AdminLookupService;

  async function setup(cardType = 'class', raw: unknown = CLASS_CARD_RAW) {
    await TestBed.configureTestingModule({
      imports: [CardEdit],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: makeActivatedRoute(cardType) },
      ],
    }).compileComponents();

    adminCardService = TestBed.inject(AdminCardService);
    adminLookupService = TestBed.inject(AdminLookupService);

    vi.spyOn(adminCardService, 'getCard').mockReturnValue(of(raw));

    fixture = TestBed.createComponent(CardEdit);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('load + populate', () => {
    it('creates component', async () => {
      await setup();
      expect(component).toBeTruthy();
    });

    it('calls getCard with expand string', async () => {
      await setup();
      expect(adminCardService.getCard).toHaveBeenCalledWith('class', 1, 'features,costTags,modifiers,expansion');
    });

    it('populates form with all domainCard schema fields', async () => {
      await setup('domainCard', DOMAIN_CARD_RAW);
      const schema = CARD_EDIT_SCHEMAS['domainCard'];
      const allFields = schema.sections.flatMap(s => s.fields);
      for (const field of allFields) {
        expect(component.cardForm.get(field.name)).toBeTruthy();
      }
    });

    it('populates rawCard signal', async () => {
      await setup();
      expect(component.rawCard()?.name).toBe('Test Card');
    });

    it('renders preview card after load', async () => {
      await setup();
      const preview = component.previewCard();
      expect(preview).toBeTruthy();
      expect(preview!.name).toBe('Test Card');
    });

    it('sets loading false after card loads', async () => {
      await setup();
      expect(component.loading()).toBe(false);
    });
  });

  describe('dirty / pending changes', () => {
    it('hasPendingChanges is false initially', async () => {
      await setup();
      expect(component.hasPendingChanges()).toBe(false);
    });

    it('hasPendingChanges is true after form edit', async () => {
      await setup();
      component.cardForm.get('name')?.setValue('Changed');
      component.cardForm.get('name')?.markAsDirty();
      expect(component.hasPendingChanges()).toBe(true);
    });

    it('hasPendingChanges is true when form is dirty', async () => {
      await setup();
      component.cardForm.get('name')?.setValue('Changed');
      component.cardForm.get('name')?.markAsDirty();
      expect(component.hasPendingChanges()).toBe(true);
    });

    it('successful save reloads card and sets saveSuccess', async () => {
      await setup();
      vi.spyOn(adminCardService, 'updateCard').mockReturnValue(of({}));
      vi.spyOn(adminCardService, 'getCard').mockReturnValue(of(CLASS_CARD_RAW));

      component.cardForm.get('name')?.setValue('Changed');
      component.cardForm.get('name')?.markAsDirty();
      component.onSave();

      await fixture.whenStable();
      fixture.detectChanges();

      expect(component.saveSuccess()).toBe(true);
      expect(component.rawCard()?.name).toBe('Test Card');
    });
  });

  describe('save button state', () => {
    it('save button is disabled when no changes', async () => {
      await setup();
      fixture.detectChanges();
      const btn = fixture.debugElement.query(By.css('button[class*="btn--primary"]'));
      expect(btn?.nativeElement.disabled).toBe(true);
    });

    it('save button is enabled after dirty change', async () => {
      await setup();
      component.cardForm.get('name')?.setValue('Changed');
      component.cardForm.get('name')?.markAsDirty();
      fixture.detectChanges();
      const btn = fixture.debugElement.query(By.css('button[class*="btn--primary"]'));
      expect(btn?.nativeElement.disabled).toBe(false);
    });
  });

  describe('onSave — success', () => {
    it('calls updateCard with schema-driven payload', async () => {
      await setup();
      const updateSpy = vi.spyOn(adminCardService, 'updateCard').mockReturnValue(of({}));
      vi.spyOn(adminCardService, 'getCard').mockReturnValue(of(CLASS_CARD_RAW));

      component.cardForm.get('name')?.setValue('Updated');
      component.cardForm.get('name')?.markAsDirty();
      component.onSave();

      expect(updateSpy).toHaveBeenCalledWith('class', 1, expect.objectContaining({ name: 'Updated' }));
    });

    it('does not call updateCard when form is clean', async () => {
      await setup();
      const updateSpy = vi.spyOn(adminCardService, 'updateCard');
      component.onSave();
      expect(updateSpy).not.toHaveBeenCalled();
      expect(component.saving()).toBe(false);
    });
  });

  describe('onSave — backend 400 with field errors', () => {
    it('applies inline error to the named field', async () => {
      await setup();
      vi.spyOn(adminCardService, 'updateCard').mockReturnValue(
        throwError(() => ({
          error: {
            errors: [{ field: 'name', defaultMessage: 'Name is too long' }],
          },
        }))
      );

      component.cardForm.get('name')?.setValue('X');
      component.cardForm.get('name')?.markAsDirty();
      component.onSave();

      expect(component.cardForm.get('name')?.errors).toEqual({ backend: 'Name is too long' });
      expect(component.error()).toBe('');
    });
  });

  describe('onSave — backend 400 without field info', () => {
    it('shows banner error when no field errors present', async () => {
      await setup();
      vi.spyOn(adminCardService, 'updateCard').mockReturnValue(
        throwError(() => ({
          error: { message: 'Unexpected server error' },
        }))
      );

      component.cardForm.get('name')?.setValue('X');
      component.cardForm.get('name')?.markAsDirty();
      component.onSave();

      expect(component.error()).toBe('Unexpected server error');
    });

    it('shows fallback message when error has no message field', async () => {
      await setup();
      vi.spyOn(adminCardService, 'updateCard').mockReturnValue(throwError(() => ({})));

      component.cardForm.get('name')?.setValue('X');
      component.cardForm.get('name')?.markAsDirty();
      component.onSave();

      expect(component.error()).toBe('Save failed. Please try again.');
    });
  });

  describe('AddExpansionDialog interaction', () => {
    it('opens dialog on openAddExpansionDialog()', async () => {
      await setup();
      expect(component.addExpansionOpen()).toBe(false);
      component.openAddExpansionDialog();
      expect(component.addExpansionOpen()).toBe(true);
    });

    it('closes dialog on closeAddExpansionDialog()', async () => {
      await setup();
      component.openAddExpansionDialog();
      component.closeAddExpansionDialog();
      expect(component.addExpansionOpen()).toBe(false);
    });

    it('onAddExpansionCreated patches expansionId, marks dirty, invalidates lookup, closes dialog', async () => {
      await setup();
      component.openAddExpansionDialog();

      const invalidateSpy = vi.spyOn(adminLookupService, 'invalidate');

      component.onAddExpansionCreated({ id: 99, name: 'New Expansion' });

      expect(component.cardForm.get('expansionId')?.value).toBe(99);
      expect(component.cardForm.get('expansionId')?.dirty).toBe(true);
      expect(invalidateSpy).toHaveBeenCalledWith('expansions');
      expect(component.addExpansionOpen()).toBe(false);
    });
  });
});
