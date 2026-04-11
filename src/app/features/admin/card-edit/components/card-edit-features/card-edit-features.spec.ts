import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { CardEditFeatures } from './card-edit-features';
import { RawFeatureResponse } from '../../../models/admin-api.model';

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
  modifierIds: [],
  costTags: [{ id: 1, label: 'Range', category: 'ATTACK' }],
  modifiers: [{ id: 1, target: 'evasion', operation: 'ADD', value: 2 }],
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

describe('CardEditFeatures', () => {
  describe('with one feature', () => {
    const HostComponent = createHostFor([mockFeature]);
    let hostFixture: ComponentFixture<InstanceType<typeof HostComponent>>;
    let host: InstanceType<typeof HostComponent>;
    let component: CardEditFeatures;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HostComponent],
        providers: [provideHttpClient(), provideHttpClientTesting()],
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

    it('should not render cost tags section when feature has no cost tags', () => {
      const button = hostFixture.nativeElement.querySelector('.feature-header');
      button.click();
      hostFixture.detectChanges();
      const tagsSection = hostFixture.nativeElement.querySelector('.feature-tags');
      expect(tagsSection).toBeNull();
    });

    it('buildFeaturePayload should use form values for name, description, featureType', () => {
      const editableFeatures = component.getEditableFeatures();
      editableFeatures[0].form.patchValue({ name: 'Updated Name', description: 'Updated Desc', featureType: 'ABILITY' });
      const payload = component.buildFeaturePayload(editableFeatures[0]);
      expect(payload.name).toBe('Updated Name');
      expect(payload.description).toBe('Updated Desc');
      expect(payload.featureType).toBe('ABILITY');
    });
  });

  describe('with no features', () => {
    const HostComponent = createHostFor([]);

    it('should render nothing when features input is empty', async () => {
      await TestBed.configureTestingModule({
        imports: [HostComponent],
        providers: [provideHttpClient(), provideHttpClientTesting()],
      }).compileComponents();

      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();
      const section = fixture.nativeElement.querySelector('.features-section');
      expect(section).toBeNull();
    });
  });

  describe('with feature having cost tags', () => {
    const HostComponent = createHostFor([mockFeatureWithTags]);
    let hostFixture: ComponentFixture<InstanceType<typeof HostComponent>>;
    let component: CardEditFeatures;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HostComponent],
        providers: [provideHttpClient(), provideHttpClientTesting()],
      }).compileComponents();

      hostFixture = TestBed.createComponent(HostComponent);
      hostFixture.detectChanges();
      component = hostFixture.debugElement.children[0].componentInstance as CardEditFeatures;
    });

    it('buildFeaturePayload should include cost tags and modifiers from pristine data', () => {
      const editableFeatures = component.getEditableFeatures();
      const payload = component.buildFeaturePayload(editableFeatures[0]);
      expect(payload.costTags).toEqual([{ label: 'Range', category: 'ATTACK' }]);
      expect(payload.modifiers).toEqual([{ target: 'evasion', operation: 'ADD', value: 2 }]);
    });

    it('should render cost tags when feature is expanded and has cost tags', () => {
      const button = hostFixture.nativeElement.querySelector('.feature-header');
      button.click();
      hostFixture.detectChanges();
      const tags = hostFixture.nativeElement.querySelectorAll('.tag');
      expect(tags.length).toBe(1);
      expect(tags[0].textContent.trim()).toBe('Range');
    });
  });

  describe('with multiple features', () => {
    const HostComponent = createHostFor([mockFeature, mockFeatureWithTags]);
    let hostFixture: ComponentFixture<InstanceType<typeof HostComponent>>;
    let component: CardEditFeatures;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HostComponent],
        providers: [provideHttpClient(), provideHttpClientTesting()],
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
  });
});
