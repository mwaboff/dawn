import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CardEdit } from './card-edit';
import { AdminCardService } from '../../../shared/services/admin-card.service';
import { FeatureEditService } from '../../../shared/services/feature-edit.service';

describe('CardEdit', () => {
  let component: CardEdit;
  let fixture: ComponentFixture<CardEdit>;
  let adminCardService: AdminCardService;
  let featureEditService: FeatureEditService;

  const mockRawCard = {
    id: 1,
    name: 'Test Card',
    description: 'A test',
    expansionId: 1,
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
      }
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardEdit],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: { cardType: 'class', id: '1' } } },
        },
      ]
    }).compileComponents();

    adminCardService = TestBed.inject(AdminCardService);
    featureEditService = TestBed.inject(FeatureEditService);
  });

  function createComponent(): void {
    vi.spyOn(adminCardService, 'getCard').mockReturnValue(of(mockRawCard));
    fixture = TestBed.createComponent(CardEdit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  it('should load card on init', () => {
    createComponent();
    expect(adminCardService.getCard).toHaveBeenCalledWith('class', 1, 'features,costTags,modifiers,expansion');
    expect(component.rawCard()?.name).toBe('Test Card');
  });

  it('should populate form with card data', () => {
    createComponent();
    expect(component.cardForm.getRawValue().name).toBe('Test Card');
    expect(component.cardForm.getRawValue().description).toBe('A test');
  });

  it('should populate features', () => {
    createComponent();
    expect(component.features().length).toBe(1);
    expect(component.features()[0].id).toBe(10);
  });

  it('should generate preview card', () => {
    createComponent();
    const preview = component.previewCard();
    expect(preview).toBeTruthy();
    expect(preview!.name).toBe('Test Card');
    expect(preview!.cardType).toBe('class');
  });

  it('should detect pending changes when form is dirty', () => {
    createComponent();
    expect(component.hasPendingChanges()).toBe(false);
    component.cardForm.get('name')?.setValue('Changed');
    component.cardForm.get('name')?.markAsDirty();
    expect(component.hasPendingChanges()).toBe(true);
  });

  it('should toggle feature expansion', () => {
    createComponent();
    expect(component.features()[0].expanded).toBe(false);
    component.toggleFeature(0);
    expect(component.features()[0].expanded).toBe(true);
    component.toggleFeature(0);
    expect(component.features()[0].expanded).toBe(false);
  });

  it('should save card changes', () => {
    createComponent();
    const updateSpy = vi.spyOn(adminCardService, 'updateCard').mockReturnValue(of({}));
    vi.spyOn(adminCardService, 'getCard').mockReturnValue(of(mockRawCard));

    component.cardForm.get('name')?.setValue('Updated');
    component.cardForm.get('name')?.markAsDirty();
    component.onSave();

    expect(updateSpy).toHaveBeenCalledWith('class', 1, expect.objectContaining({ name: 'Updated' }));
  });

  it('should save feature changes independently', () => {
    createComponent();
    const featureSpy = vi.spyOn(featureEditService, 'updateFeature').mockReturnValue(of({
      id: 10, name: 'Updated', description: '', featureType: 'CLASS',
      expansionId: 1, costTagIds: [], modifierIds: [],
    }));
    vi.spyOn(adminCardService, 'getCard').mockReturnValue(of(mockRawCard));

    const feature = component.features()[0];
    feature.form.get('name')?.setValue('Updated Feature');
    feature.form.get('name')?.markAsDirty();
    component.onSave();

    expect(featureSpy).toHaveBeenCalledWith(10, expect.objectContaining({ name: 'Updated Feature' }));
  });

  it('should not save when no changes', () => {
    createComponent();
    const updateSpy = vi.spyOn(adminCardService, 'updateCard');

    component.onSave();

    expect(updateSpy).not.toHaveBeenCalled();
    expect(component.saving()).toBe(false);
  });

  it('should show error on save failure', () => {
    createComponent();
    vi.spyOn(adminCardService, 'updateCard').mockReturnValue(
      throwError(() => ({ error: { message: 'Server error' } }))
    );

    component.cardForm.get('name')?.setValue('X');
    component.cardForm.get('name')?.markAsDirty();
    component.onSave();

    expect(component.error()).toBe('Server error');
    expect(component.saving()).toBe(false);
  });

  it('should show loading state', () => {
    vi.spyOn(adminCardService, 'getCard').mockReturnValue(of(mockRawCard));
    fixture = TestBed.createComponent(CardEdit);
    component = fixture.componentInstance;

    expect(component.loading()).toBe(true);
    fixture.detectChanges();
    expect(component.loading()).toBe(false);
  });
});
