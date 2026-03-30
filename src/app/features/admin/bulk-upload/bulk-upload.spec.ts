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
      const bulkSpy = vi.spyOn(adminCardService, 'bulkCreate').mockReturnValue(of([]));
      component.selectedType.set('weapon');
      component.jsonInput.set('[{ "name": "Sword" }]');
      component.onValidate();
      component.onUpload();

      expect(bulkSpy).toHaveBeenCalledWith('weapon', [{ name: 'Sword' }]);
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
