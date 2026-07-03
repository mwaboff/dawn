import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { ItemForm } from './item-form';
import { RawCardResponse } from '../../../features/admin/models/admin-api.model';

const RAW_WEAPON: RawCardResponse = {
  id: 7,
  name: 'Longsword',
  description: 'A fine blade',
  expansionId: 1,
  isOfficial: true,
  tier: 1,
  trait: 'AGILITY',
  range: 'MELEE',
  burden: 'ONE_HANDED',
  damage: { diceCount: 2, diceType: 'D8', modifier: 1, damageType: 'PHYSICAL' },
  cardType: 'weapon',
};

@Component({
  template: `
    <app-item-form
      [cardType]="cardType()"
      [mode]="mode()"
      [initialData]="initialData()"
      [showIsOfficialField]="showIsOfficialField()"
      [extraFeatures]="extraFeatures()"
    />
  `,
  imports: [ItemForm],
})
class HostComponent {
  cardType = signal('weapon');
  mode = signal<'create' | 'edit'>('edit');
  initialData = signal<RawCardResponse | null>(RAW_WEAPON);
  showIsOfficialField = signal(false);
  extraFeatures = signal<{ name: string; description: string }[]>([]);
}

describe('ItemForm', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let itemForm: ItemForm;

  async function setup(overrides?: Partial<{
    mode: 'create' | 'edit';
    initialData: RawCardResponse | null;
    showIsOfficialField: boolean;
    extraFeatures: { name: string; description: string }[];
  }>): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    if (overrides?.mode !== undefined) host.mode.set(overrides.mode);
    if (overrides?.initialData !== undefined) host.initialData.set(overrides.initialData);
    if (overrides?.showIsOfficialField !== undefined) host.showIsOfficialField.set(overrides.showIsOfficialField);
    if (overrides?.extraFeatures !== undefined) host.extraFeatures.set(overrides.extraFeatures);
    fixture.detectChanges();
    itemForm = fixture.debugElement.children[0].componentInstance as ItemForm;
  }

  it('creates the component', async () => {
    await setup();
    expect(itemForm).toBeTruthy();
  });

  describe('form building', () => {
    it('builds a form control for every weapon schema field', async () => {
      await setup();
      for (const field of ['name', 'description', 'expansionId', 'tier', 'trait', 'range', 'burden', 'damageDiceType']) {
        expect(itemForm.cardForm.get(field)).toBeTruthy();
      }
    });

    it('populates initial values from initialData in edit mode', async () => {
      await setup();
      expect(itemForm.cardForm.get('name')?.value).toBe('Longsword');
      expect(itemForm.cardForm.get('damageDiceType')?.value).toBe('D8');
    });

    it('defaults to empty values when initialData is null (create mode)', async () => {
      await setup({ mode: 'create', initialData: null });
      expect(itemForm.cardForm.get('name')?.value).toBe('');
      expect(itemForm.cardForm.get('expansionId')?.value).toBeNull();
    });
  });

  describe('visibleSections', () => {
    it('hides the isOfficial field when showIsOfficialField is false', async () => {
      await setup();
      const allFields = itemForm.visibleSections().flatMap(s => s.fields);
      expect(allFields.some(f => f.name === 'isOfficial')).toBe(false);
    });

    it('shows the isOfficial field when showIsOfficialField is true', async () => {
      await setup({ showIsOfficialField: true });
      const allFields = itemForm.visibleSections().flatMap(s => s.fields);
      expect(allFields.some(f => f.name === 'isOfficial')).toBe(true);
    });

    it('still includes isOfficial in the underlying form even when hidden', async () => {
      await setup();
      expect(itemForm.cardForm.get('isOfficial')).toBeTruthy();
    });
  });

  describe('previewCard', () => {
    it('reflects the loaded card name and id', async () => {
      await setup();
      const preview = itemForm.previewCard();
      expect(preview?.name).toBe('Longsword');
      expect(preview?.id).toBe(7);
      expect(preview?.cardType).toBe('weapon');
    });

    it('uses id 0 when there is no initialData (create mode)', async () => {
      await setup({ mode: 'create', initialData: null });
      expect(itemForm.previewCard()?.id).toBe(0);
    });

    it('includes extraFeatures passed in from a parent', async () => {
      await setup({ extraFeatures: [{ name: 'Sharpened', description: 'Deals extra damage' }] });
      const preview = itemForm.previewCard();
      expect(preview?.features).toHaveLength(1);
      expect(preview?.features?.[0].name).toBe('Sharpened');
    });
  });

  describe('buildPayload — edit mode', () => {
    it('returns only dirty fields (dirty-diff)', async () => {
      await setup();
      itemForm.cardForm.get('name')?.setValue('Renamed');
      itemForm.cardForm.get('name')?.markAsDirty();
      const payload = itemForm.buildPayload();
      expect(payload).toEqual({ name: 'Renamed' });
    });

    it('returns an empty object when nothing is dirty', async () => {
      await setup();
      expect(itemForm.buildPayload()).toEqual({});
    });

    it('merges extras into the payload', async () => {
      await setup();
      const payload = itemForm.buildPayload({ featureIds: [1, 2] });
      expect(payload['featureIds']).toEqual([1, 2]);
    });
  });

  describe('buildPayload — create mode', () => {
    it('returns the full payload for all schema fields', async () => {
      await setup({ mode: 'create', initialData: null });
      itemForm.cardForm.get('name')?.setValue('New Sword');
      itemForm.cardForm.get('expansionId')?.setValue(1);
      itemForm.cardForm.get('tier')?.setValue(1);
      itemForm.cardForm.get('damageDiceType')?.setValue('D6');

      const payload = itemForm.buildPayload();
      expect(payload['name']).toBe('New Sword');
      expect(payload['expansionId']).toBe(1);
      expect(payload['tier']).toBe(1);
      expect((payload['damage'] as Record<string, unknown>)['diceType']).toBe('D6');
    });

    it('coerces an untouched optional numeric field to null', async () => {
      await setup({ mode: 'create', initialData: null });
      const payload = itemForm.buildPayload();
      expect((payload['damage'] as Record<string, unknown>)['diceCount']).toBeNull();
    });
  });

  describe('hasPendingChanges', () => {
    it('is false initially', async () => {
      await setup();
      expect(itemForm.hasPendingChanges()).toBe(false);
    });

    it('is true once a control is dirtied', async () => {
      await setup();
      itemForm.cardForm.get('name')?.setValue('Changed');
      itemForm.cardForm.get('name')?.markAsDirty();
      expect(itemForm.hasPendingChanges()).toBe(true);
    });
  });

  describe('add expansion dialog', () => {
    it('is closed by default', async () => {
      await setup();
      expect(itemForm.addExpansionOpen()).toBe(false);
    });

    it('opens and closes via public methods', async () => {
      await setup();
      itemForm.openAddExpansionDialog();
      expect(itemForm.addExpansionOpen()).toBe(true);
      itemForm.closeAddExpansionDialog();
      expect(itemForm.addExpansionOpen()).toBe(false);
    });

    it('onAddExpansionCreated patches expansionId, marks it dirty, and closes the dialog', async () => {
      await setup();
      itemForm.openAddExpansionDialog();
      itemForm.onAddExpansionCreated({ id: 42, name: 'New Expansion' });
      expect(itemForm.cardForm.get('expansionId')?.value).toBe(42);
      expect(itemForm.cardForm.get('expansionId')?.dirty).toBe(true);
      expect(itemForm.addExpansionOpen()).toBe(false);
    });
  });

  describe('saved output', () => {
    it('requestSave emits the built payload', async () => {
      await setup();
      itemForm.cardForm.get('name')?.setValue('Renamed');
      itemForm.cardForm.get('name')?.markAsDirty();

      let emitted: Record<string, unknown> | undefined;
      itemForm.saved.subscribe(payload => emitted = payload);
      itemForm.requestSave();

      expect(emitted).toEqual({ name: 'Renamed' });
    });
  });

  describe('formChanged output', () => {
    it('emits whenever a control value changes', async () => {
      await setup();
      let emitCount = 0;
      itemForm.formChanged.subscribe(() => emitCount++);

      itemForm.cardForm.get('name')?.setValue('Changed');

      expect(emitCount).toBe(1);
    });
  });
});
