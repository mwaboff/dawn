import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { BulkUpload } from './bulk-upload';
import { AdminCardService } from '../../../shared/services/admin-card.service';

describe('BulkUpload', () => {
  let component: BulkUpload;
  let fixture: ComponentFixture<BulkUpload>;
  let adminCardService: AdminCardService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BulkUpload],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BulkUpload);
    component = fixture.componentInstance;
    adminCardService = TestBed.inject(AdminCardService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('card type options', () => {
    it('should include question and feature as uploadable types', () => {
      const values = component.cardTypeOptions.map(o => o.value);
      expect(values).toContain('question');
      expect(values).toContain('feature');
    });
  });

  describe('validation', () => {
    it('should show error for empty input', () => {
      component.selectedType.set('class');
      component.onValidate();
      expect(component.validationError()).toBe('JSON input is required.');
    });

    it('should show error for invalid JSON', () => {
      component.selectedType.set('class');
      component.jsonInput.set('{ broken }');
      component.onValidate();
      expect(component.validationError()).toContain('Invalid JSON');
    });

    it('should show error for non-array JSON', () => {
      component.selectedType.set('class');
      component.jsonInput.set('{ "name": "test" }');
      component.onValidate();
      expect(component.validationError()).toBe('JSON must be an array of objects.');
    });

    it('should show error for empty array', () => {
      component.selectedType.set('class');
      component.jsonInput.set('[]');
      component.onValidate();
      expect(component.validationError()).toBe('Array is empty. Nothing to upload.');
    });

    it('should show success for valid JSON array', () => {
      component.selectedType.set('class');
      component.jsonInput.set('[{ "name": "A" }, { "name": "B" }]');
      component.onValidate();
      expect(component.validationSuccess()).toBe('Valid JSON array with 2 items.');
      expect(component.validationError()).toBe('');
    });

    it('should handle single item correctly', () => {
      component.selectedType.set('class');
      component.jsonInput.set('[{ "name": "A" }]');
      component.onValidate();
      expect(component.validationSuccess()).toBe('Valid JSON array with 1 item.');
    });
  });

  describe('computed signals', () => {
    it('should disable validate when no type selected', () => {
      component.jsonInput.set('[1]');
      expect(component.canValidate()).toBe(false);
    });

    it('should disable validate when no JSON input', () => {
      component.selectedType.set('class');
      expect(component.canValidate()).toBe(false);
    });

    it('should enable validate when both type and JSON present', () => {
      component.selectedType.set('class');
      component.jsonInput.set('[1]');
      expect(component.canValidate()).toBe(true);
    });

    it('should disable upload until validation passes', () => {
      component.selectedType.set('class');
      component.jsonInput.set('[1]');
      expect(component.canUpload()).toBe(false);
    });

    it('should enable upload after successful validation', () => {
      component.selectedType.set('class');
      component.jsonInput.set('[{ "name": "A" }]');
      component.onValidate();
      expect(component.canUpload()).toBe(true);
    });
  });

  describe('upload', () => {
    it('should call bulkCreate on upload', () => {
      // Realistic nested payload (lifted from hope_and_fear-import/json/07-weapons.json's
      // "Katana") so a serialization bug that flattens/drops nested `damage`/`features`
      // objects would fail this test.
      const katana = {
        name: 'Katana',
        expansionId: 1,
        tier: 1,
        isOfficial: true,
        isPrimary: true,
        trait: 'AGILITY',
        range: 'MELEE',
        burden: 'TWO_HANDED',
        damage: { diceType: 'D10', modifier: 3, damageType: 'PHYSICAL' },
        features: [
          {
            name: 'Quick',
            description: 'When you make an attack, you can mark a Stress to target another creature within range.',
            featureType: 'ITEM',
            expansionId: 1,
          },
        ],
      };
      const bulkSpy = vi.spyOn(adminCardService, 'bulkCreate').mockReturnValue(of([]));
      component.selectedType.set('weapon');
      component.jsonInput.set(JSON.stringify([katana]));
      component.onValidate();
      component.onUpload();

      expect(bulkSpy).toHaveBeenCalledWith('weapon', [katana]);
    });

    it('should show success result after upload', () => {
      vi.spyOn(adminCardService, 'bulkCreate').mockReturnValue(of([]));
      component.selectedType.set('class');
      component.jsonInput.set('[{ "name": "A" }]');
      component.onValidate();
      component.onUpload();

      expect(component.uploadResult()?.success).toBe(true);
      expect(component.uploadResult()?.count).toBe(1);
    });

    it('should show error on upload failure', () => {
      vi.spyOn(adminCardService, 'bulkCreate').mockReturnValue(
        throwError(() => ({ error: { message: 'Bad request' } }))
      );
      component.selectedType.set('class');
      component.jsonInput.set('[{ "name": "A" }]');
      component.onValidate();
      component.onUpload();

      expect(component.uploadResult()?.success).toBe(false);
      expect(component.uploadResult()?.error).toBe('Bad request');
    });

    it('should surface field-level validation errors keyed as "list[N].field" instead of a generic message', () => {
      vi.spyOn(adminCardService, 'bulkCreate').mockReturnValue(
        throwError(() => ({
          error: {
            status: 400,
            error: 'Validation Failed',
            fieldErrors: {
              'list[2].name': 'must not be blank',
              'list[47].expansionId': 'Expansion ID is required',
            },
          },
        }))
      );
      component.selectedType.set('adversary');
      component.jsonInput.set('[{ "name": "A" }, { "name": "B" }, { "name": "" }]');
      component.onValidate();
      component.onUpload();

      const result = component.uploadResult();
      expect(result?.success).toBe(false);
      expect(result?.fieldErrors).toHaveLength(2);
      expect(result?.fieldErrors?.[0]).toEqual({ recordIndex: 2, field: 'name', message: 'must not be blank' });
      expect(result?.fieldErrors?.[1]).toEqual({ recordIndex: 47, field: 'expansionId', message: 'Expansion ID is required' });
    });

    it('should surface field-level validation errors keyed as "[N].field" (the alternate backend handler shape)', () => {
      vi.spyOn(adminCardService, 'bulkCreate').mockReturnValue(
        throwError(() => ({
          error: {
            status: 400,
            error: 'Validation Failed',
            fieldErrors: { '[0].questionType': 'Question type is required' },
          },
        }))
      );
      component.selectedType.set('question');
      component.jsonInput.set('[{ "questionText": "Why?" }]');
      component.onValidate();
      component.onUpload();

      const result = component.uploadResult();
      expect(result?.fieldErrors).toEqual([{ recordIndex: 0, field: 'questionType', message: 'Question type is required' }]);
    });

    it('should fall back to the generic message when fieldErrors is absent', () => {
      vi.spyOn(adminCardService, 'bulkCreate').mockReturnValue(
        throwError(() => ({ error: { message: 'Server exploded' } }))
      );
      component.selectedType.set('class');
      component.jsonInput.set('[{ "name": "A" }]');
      component.onValidate();
      component.onUpload();

      const result = component.uploadResult();
      expect(result?.fieldErrors).toBeUndefined();
      expect(result?.error).toBe('Server exploded');
    });

    it('should fall back to the generic message when fieldErrors is an empty object', () => {
      vi.spyOn(adminCardService, 'bulkCreate').mockReturnValue(
        throwError(() => ({ error: { message: 'Odd empty case', fieldErrors: {} } }))
      );
      component.selectedType.set('class');
      component.jsonInput.set('[{ "name": "A" }]');
      component.onValidate();
      component.onUpload();

      const result = component.uploadResult();
      expect(result?.fieldErrors).toBeUndefined();
      expect(result?.error).toBe('Odd empty case');
    });
  });

  describe('clear', () => {
    it('should reset all state on clear', () => {
      component.jsonInput.set('[1]');
      component.validationError.set('err');
      component.validationSuccess.set('ok');
      component.uploadResult.set({ success: true, count: 1 });

      component.onClear();

      expect(component.jsonInput()).toBe('');
      expect(component.validationError()).toBe('');
      expect(component.validationSuccess()).toBe('');
      expect(component.uploadResult()).toBeNull();
    });
  });

  describe('type change', () => {
    it('should reset validation on type change', () => {
      component.validationSuccess.set('ok');
      component.onTypeChange('weapon');
      expect(component.selectedType()).toBe('weapon');
      expect(component.validationSuccess()).toBe('');
    });
  });
});
