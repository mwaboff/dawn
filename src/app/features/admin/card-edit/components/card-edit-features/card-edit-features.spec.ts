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
  featureType: 'OTHER',
  expansionId: 1,
  costTagIds: [1],
  modifierIds: [1],
  costTags: [{ id: 1, label: 'Range', category: 'LIMITATION' }],
  modifiers: [{ id: 1, target: 'EVASION', operation: 'ADD', value: 2 }],
};

const mockHopeFeature: RawFeatureResponse = {
  id: 30,
  name: 'Hope Ability',
  description: 'A hope feature',
  featureType: 'HOPE',
  expansionId: 1,
  costTagIds: [],
  modifierIds: [],
  costTags: [],
  modifiers: [],
};

function createHostFor(features: RawFeatureResponse[], groupByType = false, cardType = '', expansionId = 1) {
  @Component({
    template: '<app-card-edit-features [features]="features" [saving]="saving" [groupByType]="groupByType" [cardType]="cardType" [expansionId]="expansionId" (featureDirtyChanged)="onDirtyChanged()" (deleteFeature)="onDeleteFeature($event)" />',
    imports: [CardEditFeatures],
    host: { 'data-testid': Math.random().toString(36) },
  })
  class HostComponent {
    features: RawFeatureResponse[] = features;
    saving = false;
    groupByType = groupByType;
    cardType = cardType;
    expansionId = expansionId;
    dirtyChangedCount = 0;
    deletedFeatureIds: number[] = [];
    onDirtyChanged(): void {
      this.dirtyChangedCount++;
    }
    onDeleteFeature(id: number): void {
      this.deletedFeatureIds.push(id);
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
      editableFeatures[0].form.patchValue({ name: 'Updated Name', description: 'Updated Desc', featureType: 'OTHER' });
      const payload = component.buildFeaturePayload(editableFeatures[0]);
      expect(payload.name).toBe('Updated Name');
      expect(payload.description).toBe('Updated Desc');
      expect(payload.featureType).toBe('OTHER');
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

  describe('groupByType', () => {
    describe('when groupByType is false', () => {
      const HostComponent = createHostFor([mockFeature, mockHopeFeature], false);
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

      it('returns a single group labeled "Features"', () => {
        const groups = component.getFeatureGroups();
        expect(groups.length).toBe(1);
        expect(groups[0].label).toBe('Features');
        expect(groups[0].features.length).toBe(2);
      });

      it('renders one features-section', () => {
        const sections = hostFixture.nativeElement.querySelectorAll('.features-section');
        expect(sections.length).toBe(1);
      });
    });

    describe('when groupByType is true', () => {
      const HostComponent = createHostFor([mockFeature, mockHopeFeature], true);
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

      it('returns groups by featureType', () => {
        const groups = component.getFeatureGroups();
        expect(groups.length).toBe(2);
        expect(groups[0].label).toBe('Class Features');
        expect(groups[0].features.length).toBe(1);
        expect(groups[1].label).toBe('Hope Features');
        expect(groups[1].features.length).toBe(1);
      });

      it('renders separate sections with correct headings', () => {
        const titles = hostFixture.nativeElement.querySelectorAll('.features-title');
        expect(titles.length).toBe(2);
        expect(titles[0].textContent.trim()).toBe('Class Features');
        expect(titles[1].textContent.trim()).toBe('Hope Features');
      });

      it('getGlobalIndex returns correct indices across groups', () => {
        const groups = component.getFeatureGroups();
        const classFeature = groups[0].features[0];
        const hopeFeature = groups[1].features[0];
        expect(component.getGlobalIndex(classFeature)).toBe(0);
        expect(component.getGlobalIndex(hopeFeature)).toBe(1);
      });

      it('toggling a feature in a group uses global index correctly', () => {
        const groups = component.getFeatureGroups();
        const hopeFeature = groups[1].features[0];
        const globalIdx = component.getGlobalIndex(hopeFeature);
        component.toggleFeature(globalIdx);
        const updated = component.getEditableFeatures()[globalIdx];
        expect(updated.expanded).toBe(true);
      });
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

  describe('feature type select', () => {
    const HostComponent = createHostFor([mockFeature]);
    let hostFixture: ComponentFixture<InstanceType<typeof HostComponent>>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HostComponent],
        providers,
      }).compileComponents();

      hostFixture = TestBed.createComponent(HostComponent);
      hostFixture.detectChanges();
    });

    it('renders a select with all 8 FeatureType options when a feature is expanded', () => {
      const header = hostFixture.nativeElement.querySelector('.feature-header');
      header.click();
      hostFixture.detectChanges();
      const options = hostFixture.nativeElement.querySelectorAll('.form-select option');
      expect(options.length).toBe(8);
    });

    it('renders human-readable labels for feature types', () => {
      const header = hostFixture.nativeElement.querySelector('.feature-header');
      header.click();
      hostFixture.detectChanges();
      const options = Array.from(hostFixture.nativeElement.querySelectorAll('.form-select option')) as HTMLOptionElement[];
      const labels = options.map(o => o.textContent?.trim());
      expect(labels).toContain('Hope');
      expect(labels).toContain('Class');
      expect(labels).toContain('Domain');
      expect(labels).toContain('Other');
    });
  });

  describe('draft creation (+ New Feature)', () => {
    const HostComponent = createHostFor([], false, 'domainCard', 7);
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

    it('renders the + New Feature toolbar button even when feature list is empty', () => {
      const btn = hostFixture.nativeElement.querySelector('.btn-add-feature');
      expect(btn).not.toBeNull();
      expect(btn.textContent.trim()).toBe('+ New Feature');
    });

    it('addDraft prepends an isNew feature to the list', () => {
      component.addDraft();
      const features = component.getEditableFeatures();
      expect(features.length).toBe(1);
      expect(features[0].isNew).toBe(true);
    });

    it('draft defaults feature type based on cardType (domainCard -> DOMAIN)', () => {
      component.addDraft();
      const draft = component.getEditableFeatures()[0];
      expect(draft.form.getRawValue().featureType).toBe('DOMAIN');
    });

    it('draft is expanded by default', () => {
      component.addDraft();
      const draft = component.getEditableFeatures()[0];
      expect(draft.expanded).toBe(true);
    });

    it('draft uses provided expansionId as pristine expansionId', () => {
      component.addDraft();
      const draft = component.getEditableFeatures()[0];
      expect(draft.pristine.expansionId).toBe(7);
    });

    it('draft is considered dirty immediately', () => {
      component.addDraft();
      const draft = component.getEditableFeatures()[0];
      expect(component.isDirty(draft)).toBe(true);
    });

    it('draft appears in getDirtyFeatures and getDraftFeatures', () => {
      component.addDraft();
      expect(component.getDirtyFeatures().length).toBe(1);
      expect(component.getDraftFeatures().length).toBe(1);
    });

    it('discardDraft removes the draft by index', () => {
      component.addDraft();
      expect(component.getEditableFeatures().length).toBe(1);
      component.discardDraft(0);
      expect(component.getEditableFeatures().length).toBe(0);
    });

    it('clicking + New Feature renders a feature-item with feature-item--new class', () => {
      const btn = hostFixture.nativeElement.querySelector('.btn-add-feature');
      btn.click();
      hostFixture.detectChanges();
      const newItem = hostFixture.nativeElement.querySelector('.feature-item--new');
      expect(newItem).not.toBeNull();
    });

    it('draft header shows a NEW chip', () => {
      component.addDraft();
      hostFixture.detectChanges();
      const chip = hostFixture.nativeElement.querySelector('.feature-new-chip');
      expect(chip).not.toBeNull();
      expect(chip.textContent.trim()).toBe('NEW');
    });

    it('draft renders a Discard button instead of the toggle indicator', () => {
      component.addDraft();
      hostFixture.detectChanges();
      const discard = hostFixture.nativeElement.querySelector('.btn-discard');
      expect(discard).not.toBeNull();
    });

    it('buildNewFeaturePayload returns a payload without an id and with expansionId from input', () => {
      component.addDraft();
      const draft = component.getEditableFeatures()[0];
      draft.form.patchValue({ name: 'My New Feature', description: 'Does a thing' });
      const payload = component.buildNewFeaturePayload(draft);
      expect(payload).toEqual({
        name: 'My New Feature',
        description: 'Does a thing',
        featureType: 'DOMAIN',
        expansionId: 7,
        costTags: [],
        modifiers: [],
      });
      expect((payload as unknown as Record<string, unknown>)['id']).toBeUndefined();
    });

    it('emits featureDirtyChanged when a draft is added', () => {
      const prevCount = host.dirtyChangedCount;
      component.addDraft();
      expect(host.dirtyChangedCount).toBeGreaterThan(prevCount);
    });

    it('emits featureDirtyChanged when a draft is discarded', () => {
      component.addDraft();
      const prevCount = host.dirtyChangedCount;
      component.discardDraft(0);
      expect(host.dirtyChangedCount).toBeGreaterThan(prevCount);
    });
  });

  describe('discardDraft on existing features', () => {
    const HostComponent = createHostFor([mockFeature], false, 'domainCard', 1);
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

    it('is a no-op on non-draft features', () => {
      expect(component.getEditableFeatures().length).toBe(1);
      component.discardDraft(0);
      expect(component.getEditableFeatures().length).toBe(1);
    });
  });

  describe('draft creation with ancestry cardType', () => {
    const HostComponent = createHostFor([], false, 'ancestry', 2);
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

    it('defaults draft featureType to ANCESTRY', () => {
      component.addDraft();
      expect(component.getEditableFeatures()[0].form.getRawValue().featureType).toBe('ANCESTRY');
    });
  });

  describe('draft creation with unknown cardType', () => {
    const HostComponent = createHostFor([], false, 'adversary', 2);
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

    it('falls back to OTHER', () => {
      component.addDraft();
      expect(component.getEditableFeatures()[0].form.getRawValue().featureType).toBe('OTHER');
    });
  });

  describe('feature deletion', () => {
    const HostComponent = createHostFor([mockFeature, mockFeatureWithTags]);
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

    it('renders a trash delete button for existing features', () => {
      const buttons = hostFixture.nativeElement.querySelectorAll('.btn-delete-feature');
      expect(buttons.length).toBe(2);
    });

    it('does not render a trash button for draft features', () => {
      component.addDraft();
      hostFixture.detectChanges();
      const deleteButtons = hostFixture.nativeElement.querySelectorAll('.btn-delete-feature');
      expect(deleteButtons.length).toBe(2);
      const discardButton = hostFixture.nativeElement.querySelector('.btn-discard');
      expect(discardButton).not.toBeNull();
    });

    it('shows inline Delete? strip when trash button is clicked', () => {
      const deleteBtn = (hostFixture.nativeElement.querySelectorAll('.btn-delete-feature')[0] as HTMLButtonElement);
      deleteBtn.click();
      hostFixture.detectChanges();
      const inlineConfirm = hostFixture.nativeElement.querySelector('.feature-inline-confirm');
      expect(inlineConfirm).not.toBeNull();
      expect(hostFixture.nativeElement.querySelector('.feature-inline-confirm-text')?.textContent?.trim()).toBe('Delete?');
    });

    it('does not open modal on first click', () => {
      const deleteBtn = (hostFixture.nativeElement.querySelectorAll('.btn-delete-feature')[0] as HTMLButtonElement);
      deleteBtn.click();
      hostFixture.detectChanges();
      expect(hostFixture.nativeElement.querySelector('app-confirm-dialog')).toBeNull();
    });

    it('hides inline strip when No is clicked', () => {
      (hostFixture.nativeElement.querySelectorAll('.btn-delete-feature')[0] as HTMLButtonElement).click();
      hostFixture.detectChanges();
      (hostFixture.nativeElement.querySelector('.feature-inline-cancel-btn') as HTMLButtonElement).click();
      hostFixture.detectChanges();
      expect(hostFixture.nativeElement.querySelector('.feature-inline-confirm')).toBeNull();
    });

    it('opens ConfirmDialog when Yes is clicked', () => {
      (hostFixture.nativeElement.querySelectorAll('.btn-delete-feature')[0] as HTMLButtonElement).click();
      hostFixture.detectChanges();
      (hostFixture.nativeElement.querySelector('.feature-inline-confirm-btn') as HTMLButtonElement).click();
      hostFixture.detectChanges();
      expect(hostFixture.nativeElement.querySelector('app-confirm-dialog')).not.toBeNull();
      expect(host.deletedFeatureIds.length).toBe(0);
    });

    it('emits deleteFeature with correct id on modal confirm', () => {
      (hostFixture.nativeElement.querySelectorAll('.btn-delete-feature')[0] as HTMLButtonElement).click();
      hostFixture.detectChanges();
      (hostFixture.nativeElement.querySelector('.feature-inline-confirm-btn') as HTMLButtonElement).click();
      hostFixture.detectChanges();
      (hostFixture.nativeElement.querySelector('.dialog-btn--confirm') as HTMLButtonElement).click();
      hostFixture.detectChanges();
      expect(host.deletedFeatureIds).toEqual([mockFeature.id]);
    });

    it('does not emit deleteFeature when modal cancel is clicked', () => {
      (hostFixture.nativeElement.querySelectorAll('.btn-delete-feature')[0] as HTMLButtonElement).click();
      hostFixture.detectChanges();
      (hostFixture.nativeElement.querySelector('.feature-inline-confirm-btn') as HTMLButtonElement).click();
      hostFixture.detectChanges();
      (hostFixture.nativeElement.querySelector('.dialog-btn--cancel') as HTMLButtonElement).click();
      hostFixture.detectChanges();
      expect(host.deletedFeatureIds.length).toBe(0);
      expect(hostFixture.nativeElement.querySelector('app-confirm-dialog')).toBeNull();
    });

    it('sets deletingId and disables modal buttons while deleting', () => {
      (hostFixture.nativeElement.querySelectorAll('.btn-delete-feature')[0] as HTMLButtonElement).click();
      hostFixture.detectChanges();
      (hostFixture.nativeElement.querySelector('.feature-inline-confirm-btn') as HTMLButtonElement).click();
      hostFixture.detectChanges();
      (hostFixture.nativeElement.querySelector('.dialog-btn--confirm') as HTMLButtonElement).click();
      hostFixture.detectChanges();
      expect(component.deletingId()).toBe(mockFeature.id);
    });

    it('resetDeleteState clears all delete signals', () => {
      (hostFixture.nativeElement.querySelectorAll('.btn-delete-feature')[0] as HTMLButtonElement).click();
      hostFixture.detectChanges();
      (hostFixture.nativeElement.querySelector('.feature-inline-confirm-btn') as HTMLButtonElement).click();
      hostFixture.detectChanges();
      component.resetDeleteState();
      expect(component.pendingDeleteId()).toBeNull();
      expect(component.confirmingDeleteId()).toBeNull();
      expect(component.deletingId()).toBeNull();
    });

  });

  describe('getExistingDirtyFeatures', () => {
    const HostComponent = createHostFor([mockFeature], false, 'domainCard', 1);
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

    it('excludes drafts from getExistingDirtyFeatures', () => {
      component.addDraft();
      const existing = component.getEditableFeatures()[1];
      existing.form.get('name')?.setValue('Edited');
      existing.form.get('name')?.markAsDirty();
      const existingDirty = component.getExistingDirtyFeatures();
      expect(existingDirty.length).toBe(1);
      expect(existingDirty[0].id).toBe(mockFeature.id);
    });
  });
});
