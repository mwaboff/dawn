import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { of } from 'rxjs';
import { CardEditFeatures } from './card-edit-features';
import { RawFeatureResponse } from '../../../models/admin-api.model';
import { CostTagLookupService } from '../../../../../shared/services/cost-tag-lookup.service';

const mockCostTagLookupService = {
  list: () => of([]),
  listFull: () => of([
    { id: 1, label: '3 Hope', category: 'COST' },
    { id: 2, label: '1/session', category: 'TIMING' },
  ]),
};

const mockFeature: RawFeatureResponse = {
  id: 10,
  name: 'Feature A',
  description: 'Desc A',
  featureType: 'CLASS',
  expansionId: 1,
  costTagIds: [],
  modifierIds: [],
  costTags: [],
  modifiers: [],
};

const mockFeatureWithTags: RawFeatureResponse = {
  id: 20,
  name: 'Feature B',
  description: 'Desc B',
  featureType: 'ABILITY',
  expansionId: 1,
  costTagIds: [1],
  modifierIds: [1],
  costTags: [{ id: 1, label: 'Range', category: 'LIMITATION' }],
  modifiers: [{ id: 1, target: 'EVASION', operation: 'ADD', value: 2 }],
};

function createHostFor(features: RawFeatureResponse[]) {
  @Component({
    template: '<app-card-edit-features [features]="features" [saving]="saving" (featureDirtyChanged)="onDirtyChanged()" />',
    imports: [CardEditFeatures],
    host: { 'data-testid': Math.random().toString(36) },
  })
  class HostComponent {
    features: RawFeatureResponse[] = features;
    saving = false;
    dirtyChangedCount = 0;
    onDirtyChanged(): void {
      this.dirtyChangedCount++;
    }
  }
  return HostComponent;
}

const providers = [
  provideHttpClient(),
  provideHttpClientTesting(),
  { provide: CostTagLookupService, useValue: mockCostTagLookupService },
];

describe('CardEditFeatures', () => {
  describe('with one feature', () => {
    const HostComponent = createHostFor([mockFeature]);
    let hostFixture: ComponentFixture<InstanceType<typeof HostComponent>>;
    let host: InstanceType<typeof HostComponent>;
    let component: CardEditFeatures;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HostComponent],
        providers,
      }).compileComponents();

      hostFixture = TestBed.createComponent(HostComponent);
      host = hostFixture.componentInstance;
      hostFixture.detectChanges();
      component = hostFixture.debugElement.children[0].componentInstance as CardEditFeatures;
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render the features section', () => {
      const featureItems = hostFixture.nativeElement.querySelectorAll('.feature-item');
      expect(featureItems.length).toBe(1);
    });

    it('should show feature name in collapsed header', () => {
      const header = hostFixture.nativeElement.querySelector('.feature-name');
      expect(header.textContent.trim()).toBe('Feature A');
    });

    it('should be collapsed by default', () => {
      const body = hostFixture.nativeElement.querySelector('.feature-body');
      expect(body).toBeNull();
    });

    it('should expand feature on toggle button click', () => {
      const button = hostFixture.nativeElement.querySelector('.feature-header');
      button.click();
      hostFixture.detectChanges();
      const body = hostFixture.nativeElement.querySelector('.feature-body');
      expect(body).not.toBeNull();
    });

    it('should collapse an expanded feature on second click', () => {
      const button = hostFixture.nativeElement.querySelector('.feature-header');
      button.click();
      hostFixture.detectChanges();
      button.click();
      hostFixture.detectChanges();
      const body = hostFixture.nativeElement.querySelector('.feature-body');
      expect(body).toBeNull();
    });

    it('should show + toggle indicator when collapsed', () => {
      const toggle = hostFixture.nativeElement.querySelector('.feature-toggle');
      expect(toggle.textContent.trim()).toBe('+');
    });

    it('should show − toggle indicator when expanded', () => {
      const button = hostFixture.nativeElement.querySelector('.feature-header');
      button.click();
      hostFixture.detectChanges();
      const toggle = hostFixture.nativeElement.querySelector('.feature-toggle');
      expect(toggle.textContent.trim()).toBe('−');
    });

    it('should not show dirty dot initially', () => {
      const dirtyDot = hostFixture.nativeElement.querySelector('.feature-dirty-dot');
      expect(dirtyDot).toBeNull();
    });

    it('should show dirty dot after editing a field', () => {
      const editableFeatures = component.getEditableFeatures();
      editableFeatures[0].form.get('name')?.setValue('Changed');
      editableFeatures[0].form.get('name')?.markAsDirty();
      hostFixture.detectChanges();
      const dirtyDot = hostFixture.nativeElement.querySelector('.feature-dirty-dot');
      expect(dirtyDot).not.toBeNull();
    });

    it('should apply feature-item--dirty class when feature is dirty', () => {
      const editableFeatures = component.getEditableFeatures();
      editableFeatures[0].form.get('name')?.setValue('Changed');
      editableFeatures[0].form.get('name')?.markAsDirty();
      hostFixture.detectChanges();
      const featureItem = hostFixture.nativeElement.querySelector('.feature-item');
      expect(featureItem.classList).toContain('feature-item--dirty');
    });

    it('getDirtyFeatures should return empty array when nothing is dirty', () => {
      const dirty = component.getDirtyFeatures();
      expect(dirty.length).toBe(0);
    });

    it('featureDirtyChanged should emit when a field value changes', () => {
      const editableFeatures = component.getEditableFeatures();
      editableFeatures[0].form.get('name')?.setValue('Changed');
      expect(host.dirtyChangedCount).toBeGreaterThan(0);
    });

    it('buildFeaturePayload should return correct FeatureUpdateRequest', () => {
      const editableFeatures = component.getEditableFeatures();
      const payload = component.buildFeaturePayload(editableFeatures[0]);
      expect(payload).toEqual({
        name: 'Feature A',
        description: 'Desc A',
        featureType: 'CLASS',
        expansionId: 1,
        costTags: [],
        modifiers: [],
      });
    });

    it('buildFeaturePayload should use form values for name, description, featureType', () => {
      const editableFeatures = component.getEditableFeatures();
      editableFeatures[0].form.patchValue({ name: 'Updated Name', description: 'Updated Desc', featureType: 'ABILITY' });
      const payload = component.buildFeaturePayload(editableFeatures[0]);
      expect(payload.name).toBe('Updated Name');
      expect(payload.description).toBe('Updated Desc');
      expect(payload.featureType).toBe('ABILITY');
    });

    it('isDirty should return false initially', () => {
      const feature = component.getEditableFeatures()[0];
      expect(component.isDirty(feature)).toBe(false);
    });
  });

  describe('with no features', () => {
    const HostComponent = createHostFor([]);

    it('should render nothing when features input is empty', async () => {
      await TestBed.configureTestingModule({
        imports: [HostComponent],
        providers,
      }).compileComponents();

      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();
      const section = fixture.nativeElement.querySelector('.features-section');
      expect(section).toBeNull();
    });
  });

  describe('with feature having cost tags and modifiers', () => {
    const HostComponent = createHostFor([mockFeatureWithTags]);
    let hostFixture: ComponentFixture<InstanceType<typeof HostComponent>>;
    let component: CardEditFeatures;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HostComponent],
        providers,
      }).compileComponents();

      hostFixture = TestBed.createComponent(HostComponent);
      hostFixture.detectChanges();
      component = hostFixture.debugElement.children[0].componentInstance as CardEditFeatures;
    });

    it('buildFeaturePayload should include cost tags and modifiers from initial data', () => {
      const editableFeatures = component.getEditableFeatures();
      const payload = component.buildFeaturePayload(editableFeatures[0]);
      expect(payload.costTags).toEqual([{ label: 'Range', category: 'LIMITATION' }]);
      expect(payload.modifiers).toEqual([{ target: 'EVASION', operation: 'ADD', value: 2 }]);
    });

    it('should render cost tag chips when feature is expanded', () => {
      const button = hostFixture.nativeElement.querySelector('.feature-header');
      button.click();
      hostFixture.detectChanges();
      const chips = hostFixture.nativeElement.querySelectorAll('.tag-chip');
      expect(chips.length).toBe(1);
    });

    it('should render modifier rows when feature is expanded', () => {
      const button = hostFixture.nativeElement.querySelector('.feature-header');
      button.click();
      hostFixture.detectChanges();
      const rows = hostFixture.nativeElement.querySelectorAll('.modifier-row');
      expect(rows.length).toBe(1);
    });
  });

  describe('cost tag editing', () => {
    const HostComponent = createHostFor([mockFeature]);
    let hostFixture: ComponentFixture<InstanceType<typeof HostComponent>>;
    let host: InstanceType<typeof HostComponent>;
    let component: CardEditFeatures;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HostComponent],
        providers,
      }).compileComponents();

      hostFixture = TestBed.createComponent(HostComponent);
      host = hostFixture.componentInstance;
      hostFixture.detectChanges();
      component = hostFixture.debugElement.children[0].componentInstance as CardEditFeatures;
    });

    it('addCostTag matches existing tag by label and uses its category', () => {
      const feature = component.getEditableFeatures()[0];
      feature.addTagForm.patchValue({ newLabel: '3 Hope', newCategory: 'TIMING' });
      component.addCostTag(0);
      const updated = component.getEditableFeatures()[0];
      expect(updated.costTags).toEqual([{ label: '3 Hope', category: 'COST' }]);
    });

    it('addCostTag adds new tag with typed label and category when no match', () => {
      const feature = component.getEditableFeatures()[0];
      feature.addTagForm.patchValue({ newLabel: 'My Tag', newCategory: 'LIMITATION' });
      component.addCostTag(0);
      const updated = component.getEditableFeatures()[0];
      expect(updated.costTags).toEqual([{ label: 'My Tag', category: 'LIMITATION' }]);
    });

    it('addCostTag does nothing when label is empty', () => {
      const feature = component.getEditableFeatures()[0];
      feature.addTagForm.patchValue({ newLabel: '  ' });
      component.addCostTag(0);
      expect(component.getEditableFeatures()[0].costTags.length).toBe(0);
    });

    it('addCostTag does not add duplicate tags (case-insensitive)', () => {
      const feature = component.getEditableFeatures()[0];
      feature.addTagForm.patchValue({ newLabel: 'My Tag', newCategory: 'COST' });
      component.addCostTag(0);
      feature.addTagForm.patchValue({ newLabel: 'my tag', newCategory: 'COST' });
      component.addCostTag(0);
      expect(component.getEditableFeatures()[0].costTags.length).toBe(1);
    });

    it('addCostTag marks tagsDirty and emits featureDirtyChanged', () => {
      const prevCount = host.dirtyChangedCount;
      const feature = component.getEditableFeatures()[0];
      feature.addTagForm.patchValue({ newLabel: 'New Tag', newCategory: 'COST' });
      component.addCostTag(0);
      expect(component.getEditableFeatures()[0].tagsDirty).toBe(true);
      expect(host.dirtyChangedCount).toBeGreaterThan(prevCount);
    });

    it('removeCostTag removes tag at given index', () => {
      const feature = component.getEditableFeatures()[0];
      feature.addTagForm.patchValue({ newLabel: 'Tag A', newCategory: 'COST' });
      component.addCostTag(0);
      component.removeCostTag(0, 0);
      expect(component.getEditableFeatures()[0].costTags.length).toBe(0);
    });

    it('removeCostTag marks tagsDirty and emits featureDirtyChanged', () => {
      const feature = component.getEditableFeatures()[0];
      feature.addTagForm.patchValue({ newLabel: 'Tag A', newCategory: 'COST' });
      component.addCostTag(0);
      const prevCount = host.dirtyChangedCount;
      component.removeCostTag(0, 0);
      expect(component.getEditableFeatures()[0].tagsDirty).toBe(true);
      expect(host.dirtyChangedCount).toBeGreaterThan(prevCount);
    });

    it('isDirty returns true after adding a cost tag', () => {
      const feature = component.getEditableFeatures()[0];
      feature.addTagForm.patchValue({ newLabel: 'New', newCategory: 'COST' });
      component.addCostTag(0);
      const updated = component.getEditableFeatures()[0];
      expect(component.isDirty(updated)).toBe(true);
    });

    it('getDirtyFeatures includes feature after tag change', () => {
      const feature = component.getEditableFeatures()[0];
      feature.addTagForm.patchValue({ newLabel: 'New', newCategory: 'COST' });
      component.addCostTag(0);
      expect(component.getDirtyFeatures().length).toBe(1);
    });
  });

  describe('modifier editing', () => {
    const HostComponent = createHostFor([mockFeature]);
    let hostFixture: ComponentFixture<InstanceType<typeof HostComponent>>;
    let host: InstanceType<typeof HostComponent>;
    let component: CardEditFeatures;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HostComponent],
        providers,
      }).compileComponents();

      hostFixture = TestBed.createComponent(HostComponent);
      host = hostFixture.componentInstance;
      hostFixture.detectChanges();
      component = hostFixture.debugElement.children[0].componentInstance as CardEditFeatures;
    });

    it('addModifier adds modifier with selected target, operation, value', () => {
      const feature = component.getEditableFeatures()[0];
      feature.addModifierForm.patchValue({ target: 'STRENGTH', operation: 'ADD', value: 2 });
      component.addModifier(0);
      const updated = component.getEditableFeatures()[0];
      expect(updated.modifiers).toEqual([{ target: 'STRENGTH', operation: 'ADD', value: 2 }]);
    });

    it('addModifier marks modifiersDirty and emits featureDirtyChanged', () => {
      const prevCount = host.dirtyChangedCount;
      const feature = component.getEditableFeatures()[0];
      feature.addModifierForm.patchValue({ target: 'GOLD', operation: 'SET', value: 10 });
      component.addModifier(0);
      expect(component.getEditableFeatures()[0].modifiersDirty).toBe(true);
      expect(host.dirtyChangedCount).toBeGreaterThan(prevCount);
    });

    it('removeModifier removes modifier at given index', () => {
      const feature = component.getEditableFeatures()[0];
      feature.addModifierForm.patchValue({ target: 'AGILITY', operation: 'ADD', value: 1 });
      component.addModifier(0);
      component.removeModifier(0, 0);
      expect(component.getEditableFeatures()[0].modifiers.length).toBe(0);
    });

    it('removeModifier marks modifiersDirty and emits featureDirtyChanged', () => {
      const feature = component.getEditableFeatures()[0];
      feature.addModifierForm.patchValue({ target: 'AGILITY', operation: 'ADD', value: 1 });
      component.addModifier(0);
      const prevCount = host.dirtyChangedCount;
      component.removeModifier(0, 0);
      expect(component.getEditableFeatures()[0].modifiersDirty).toBe(true);
      expect(host.dirtyChangedCount).toBeGreaterThan(prevCount);
    });

    it('isDirty returns true after adding a modifier', () => {
      const feature = component.getEditableFeatures()[0];
      feature.addModifierForm.patchValue({ target: 'KNOWLEDGE', operation: 'ADD', value: 1 });
      component.addModifier(0);
      const updated = component.getEditableFeatures()[0];
      expect(component.isDirty(updated)).toBe(true);
    });

    it('buildFeaturePayload reflects added modifier', () => {
      const feature = component.getEditableFeatures()[0];
      feature.addModifierForm.patchValue({ target: 'EVASION', operation: 'ADD', value: -1 });
      component.addModifier(0);
      const payload = component.buildFeaturePayload(component.getEditableFeatures()[0]);
      expect(payload.modifiers).toEqual([{ target: 'EVASION', operation: 'ADD', value: -1 }]);
    });
  });

  describe('with multiple features', () => {
    const HostComponent = createHostFor([mockFeature, mockFeatureWithTags]);
    let hostFixture: ComponentFixture<InstanceType<typeof HostComponent>>;
    let component: CardEditFeatures;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HostComponent],
        providers,
      }).compileComponents();

      hostFixture = TestBed.createComponent(HostComponent);
      hostFixture.detectChanges();
      component = hostFixture.debugElement.children[0].componentInstance as CardEditFeatures;
    });

    it('getDirtyFeatures should return only dirty features', () => {
      const editableFeatures = component.getEditableFeatures();
      editableFeatures[0].form.get('name')?.setValue('Changed');
      editableFeatures[0].form.get('name')?.markAsDirty();
      const dirty = component.getDirtyFeatures();
      expect(dirty.length).toBe(1);
      expect(dirty[0].id).toBe(10);
    });

    it('addCostTag affects only the targeted feature', () => {
      const feature0 = component.getEditableFeatures()[0];
      feature0.addTagForm.patchValue({ newLabel: 'Only Feature 0', newCategory: 'COST' });
      component.addCostTag(0);
      expect(component.getEditableFeatures()[0].costTags.length).toBe(1);
      expect(component.getEditableFeatures()[1].costTags.length).toBe(1);
    });
  });
});
