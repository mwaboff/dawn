import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { CardEdit } from './card-edit';
import { AdminCardService } from '../../../shared/services/admin-card.service';
import { FeatureEditService } from '../../../shared/services/feature-edit.service';
import { AdminLookupService } from './services/admin-lookup.service';
import { RawFeatureResponse } from '../models/admin-api.model';
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

const CLASS_CARD_WITH_SPLIT_FEATURES = {
  id: 2,
  name: 'Split Feature Class',
  description: 'A class with separate hope/class features',
  expansionId: 1,
  startingEvasion: 8,
  startingHitPoints: 6,
  startingClassItems: '',
  associatedDomainIds: [],
  cardType: 'class',
  hopeFeatures: [
    {
      id: 100,
      name: 'Hope Ability',
      description: 'Hope desc',
      featureType: 'HOPE',
      expansionId: 1,
      costTagIds: [],
      modifierIds: [],
      costTags: [],
      modifiers: [],
    },
  ],
  classFeatures: [
    {
      id: 200,
      name: 'Class Ability',
      description: 'Class desc',
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

    it('calls getCard with class-specific expand string for classes', async () => {
      await setup();
      expect(adminCardService.getCard).toHaveBeenCalledWith('class', 1, 'classFeatures,hopeFeatures,costTags,modifiers,expansion');
    });

    it('calls getCard with standard expand string for non-class types', async () => {
      await setup('domainCard', DOMAIN_CARD_RAW);
      expect(adminCardService.getCard).toHaveBeenCalledWith('domainCard', 1, 'features,costTags,modifiers,expansion');
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

  describe('11-type schema smoke test', () => {
    const ALL_TYPES = Object.keys(CARD_EDIT_SCHEMAS);

    it.each(ALL_TYPES)('loads without error and builds form for cardType=%s', async (cardType) => {
      const schema = CARD_EDIT_SCHEMAS[cardType];
      const firstField = schema.sections[0].fields[0];
      const raw = { id: 1, cardType, name: 'Smoke Test', features: [], [firstField.name]: '' };
      await setup(cardType, raw);
      expect(component).toBeTruthy();
      expect(component.cardForm.get(firstField.name)).toBeTruthy();
    });
  });

  describe('extractFeatures — class with split features', () => {
    it('combines hopeFeatures and classFeatures when features array is absent', async () => {
      await setup('class', CLASS_CARD_WITH_SPLIT_FEATURES);
      const features = component.rawFeatures();
      expect(features.length).toBe(2);
      expect(features[0].name).toBe('Hope Ability');
      expect(features[1].name).toBe('Class Ability');
    });

    it('uses features array when present', async () => {
      await setup('class', CLASS_CARD_RAW);
      const features = component.rawFeatures();
      expect(features.length).toBe(1);
      expect(features[0].name).toBe('Feature A');
    });
  });

  describe('onSave — with draft features', () => {
    const DOMAIN_CARD_RAW_WITH_FEATURE = {
      ...DOMAIN_CARD_RAW,
      features: [
        {
          id: 77,
          name: 'Existing',
          description: 'Existing desc',
          featureType: 'DOMAIN',
          expansionId: 1,
          costTagIds: [],
          modifierIds: [],
          costTags: [],
          modifiers: [],
        },
      ],
    };

    it('issues a single updateCard call with features array when only a draft is present', async () => {
      await setup('domainCard', DOMAIN_CARD_RAW_WITH_FEATURE);
      const updateSpy = vi.spyOn(adminCardService, 'updateCard').mockReturnValue(of({}));
      vi.spyOn(adminCardService, 'getCard').mockReturnValue(of(DOMAIN_CARD_RAW_WITH_FEATURE));

      const featuresComp = fixture.debugElement.query(By.css('app-card-edit-features')).componentInstance;
      featuresComp.addDraft();
      const draft = featuresComp.getEditableFeatures()[0];
      draft.form.patchValue({ name: 'Draft Name', description: 'Draft Desc' });

      component.onSave();

      expect(updateSpy).toHaveBeenCalledTimes(1);
      const [, , body] = updateSpy.mock.calls[0];
      const b = body as Record<string, unknown>;
      const features = b['features'] as Record<string, unknown>[];
      expect(features.length).toBe(1);
      expect(features[0]['name']).toBe('Draft Name');
      expect(features[0]['featureType']).toBe('DOMAIN');
      expect(features[0]['id']).toBeUndefined();
      expect(b['featureIds']).toEqual([77]);
    });

    it('routes draft + existing feature edit into separate PUT calls', async () => {
      await setup('domainCard', DOMAIN_CARD_RAW_WITH_FEATURE);
      const updateCardSpy = vi.spyOn(adminCardService, 'updateCard').mockReturnValue(of({}));
      const featureEditService = TestBed.inject(FeatureEditService);
      const updateFeatureSpy = vi.spyOn(featureEditService, 'updateFeature').mockReturnValue(of({} as RawFeatureResponse));
      vi.spyOn(adminCardService, 'getCard').mockReturnValue(of(DOMAIN_CARD_RAW_WITH_FEATURE));

      const featuresComp = fixture.debugElement.query(By.css('app-card-edit-features')).componentInstance;
      featuresComp.addDraft();
      const draft = featuresComp.getEditableFeatures()[0];
      draft.form.patchValue({ name: 'Draft', description: 'D' });
      const existing = featuresComp.getEditableFeatures()[1];
      existing.form.get('name')?.setValue('Edited');
      existing.form.get('name')?.markAsDirty();

      component.onSave();

      expect(updateCardSpy).toHaveBeenCalledTimes(1);
      expect(updateFeatureSpy).toHaveBeenCalledTimes(1);
      expect(updateFeatureSpy).toHaveBeenCalledWith(77, expect.objectContaining({ name: 'Edited' }));
    });

    it('does not call updateCard when drafts are discarded and no other changes exist', async () => {
      await setup('domainCard', DOMAIN_CARD_RAW);
      const updateSpy = vi.spyOn(adminCardService, 'updateCard');

      const featuresComp = fixture.debugElement.query(By.css('app-card-edit-features')).componentInstance;
      featuresComp.addDraft();
      featuresComp.discardDraft(0);

      component.onSave();

      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('splits class-card drafts by featureType into hopeFeatures/classFeatures', async () => {
      await setup('class', CLASS_CARD_WITH_SPLIT_FEATURES);
      const updateSpy = vi.spyOn(adminCardService, 'updateCard').mockReturnValue(of({}));
      vi.spyOn(adminCardService, 'getCard').mockReturnValue(of(CLASS_CARD_WITH_SPLIT_FEATURES));

      const featuresComp = fixture.debugElement.query(By.css('app-card-edit-features')).componentInstance;
      featuresComp.addDraft();
      featuresComp.getEditableFeatures()[0].form.patchValue({ name: 'Class Draft', featureType: 'CLASS' });
      featuresComp.addDraft();
      featuresComp.getEditableFeatures()[0].form.patchValue({ name: 'Hope Draft', featureType: 'HOPE' });

      component.onSave();

      const [, , body] = updateSpy.mock.calls[0];
      const b = body as Record<string, unknown>;
      expect((b['hopeFeatures'] as unknown[]).length).toBe(1);
      expect((b['classFeatures'] as unknown[]).length).toBe(1);
      expect((b['hopeFeatures'] as Record<string, unknown>[])[0]['name']).toBe('Hope Draft');
      expect((b['classFeatures'] as Record<string, unknown>[])[0]['name']).toBe('Class Draft');
      expect(b['features']).toBeUndefined();
      expect(b['hopeFeatureIds']).toEqual([100]);
      expect(b['classFeatureIds']).toEqual([200]);
    });
  });

  describe('onDelete', () => {
    it('calls deleteCard and navigates to /admin/cards on success', async () => {
      await setup();
      const deleteSpy = vi.spyOn(adminCardService, 'deleteCard').mockReturnValue(of(void 0 as void));
      const router = TestBed.inject(Router);
      const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      component.onDelete();

      expect(deleteSpy).toHaveBeenCalledWith('class', 1);
      expect(navSpy).toHaveBeenCalledWith(['/admin/cards']);
      expect(component.deleting()).toBe(false);
    });

    it('sets error on delete failure', async () => {
      await setup();
      vi.spyOn(adminCardService, 'deleteCard').mockReturnValue(
        throwError(() => ({ error: { message: 'Cannot delete' } }))
      );

      component.onDelete();

      expect(component.error()).toBe('Cannot delete');
      expect(component.deleting()).toBe(false);
    });

    it('shows fallback error message when no message field', async () => {
      await setup();
      vi.spyOn(adminCardService, 'deleteCard').mockReturnValue(throwError(() => ({})));

      component.onDelete();

      expect(component.error()).toBe('Delete failed. Please try again.');
    });
  });

  describe('onDeleteFeature', () => {
    const DOMAIN_CARD_RAW_WITH_FEATURE = {
      ...DOMAIN_CARD_RAW,
      features: [
        {
          id: 77,
          name: 'Existing',
          description: 'Existing desc',
          featureType: 'DOMAIN',
          expansionId: 1,
          costTagIds: [],
          modifierIds: [],
          costTags: [],
          modifiers: [],
        },
      ],
    };

    it('calls FeatureEditService.deleteFeature with id and reloads card on success', async () => {
      await setup('domainCard', DOMAIN_CARD_RAW_WITH_FEATURE);
      const featureEditService = TestBed.inject(FeatureEditService);
      const deleteSpy = vi.spyOn(featureEditService, 'deleteFeature').mockReturnValue(of(void 0 as void));
      const reloadSpy = vi.spyOn(adminCardService, 'getCard').mockReturnValue(of(DOMAIN_CARD_RAW));

      component.onDeleteFeature(77);
      await fixture.whenStable();

      expect(deleteSpy).toHaveBeenCalledWith(77);
      expect(reloadSpy).toHaveBeenCalled();
    });

    it('sets error banner when delete fails', async () => {
      await setup('domainCard', DOMAIN_CARD_RAW_WITH_FEATURE);
      const featureEditService = TestBed.inject(FeatureEditService);
      vi.spyOn(featureEditService, 'deleteFeature').mockReturnValue(
        throwError(() => ({ error: { message: 'Cannot delete feature' } }))
      );

      component.onDeleteFeature(77);
      await fixture.whenStable();

      expect(component.error()).toBe('Cannot delete feature');
    });

    it('shows fallback message when error has no message', async () => {
      await setup('domainCard', DOMAIN_CARD_RAW_WITH_FEATURE);
      const featureEditService = TestBed.inject(FeatureEditService);
      vi.spyOn(featureEditService, 'deleteFeature').mockReturnValue(throwError(() => ({})));

      component.onDeleteFeature(77);
      await fixture.whenStable();

      expect(component.error()).toBe('Delete feature failed. Please try again.');
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
