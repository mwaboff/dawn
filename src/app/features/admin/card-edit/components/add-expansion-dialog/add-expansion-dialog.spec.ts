import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { vi } from 'vitest';

import { AddExpansionDialog } from './add-expansion-dialog';
import { ExpansionService } from '../../../../../shared/services/expansion.service';
import { ExpansionOption } from '../../../../../shared/models/expansion-api.model';

interface MockExpansionService {
  createExpansion: ReturnType<typeof vi.fn>;
}

function buildMockExpansionService(): MockExpansionService {
  return {
    createExpansion: vi.fn(),
  };
}

describe('AddExpansionDialog', () => {
  let fixture: ComponentFixture<AddExpansionDialog>;
  let component: AddExpansionDialog;
  let mockExpansionService: MockExpansionService;

  beforeEach(async () => {
    mockExpansionService = buildMockExpansionService();

    await TestBed.configureTestingModule({
      imports: [AddExpansionDialog],
      providers: [{ provide: ExpansionService, useValue: mockExpansionService }],
    }).compileComponents();

    fixture = TestBed.createComponent(AddExpansionDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Rendering', () => {
    it('should render the dialog title', () => {
      const title = fixture.nativeElement.querySelector('.dialog-title') as HTMLElement;
      expect(title.textContent?.trim()).toBe('Create Expansion');
    });

    it('should render the name input', () => {
      const input = fixture.nativeElement.querySelector('#expansion-name');
      expect(input).toBeTruthy();
    });

    it('should render the published checkbox', () => {
      const checkbox = fixture.nativeElement.querySelector('input[type="checkbox"]');
      expect(checkbox).toBeTruthy();
    });

    it('should render Create and Cancel buttons', () => {
      const submitBtn = fixture.nativeElement.querySelector('.dialog-btn--submit') as HTMLButtonElement;
      const cancelBtn = fixture.nativeElement.querySelector('.dialog-btn--cancel') as HTMLButtonElement;
      expect(submitBtn.textContent?.trim()).toBe('Create');
      expect(cancelBtn.textContent?.trim()).toBe('Cancel');
    });

    it('should show "Creating..." on submit button when processing', () => {
      const pending$ = new Subject<ExpansionOption>();
      mockExpansionService.createExpansion.mockReturnValue(pending$);

      component.form.controls.name.setValue('Test');
      component.onSubmit();
      fixture.detectChanges();

      const submitBtn = fixture.nativeElement.querySelector('.dialog-btn--submit') as HTMLButtonElement;
      expect(submitBtn.textContent?.trim()).toBe('Creating...');
      pending$.complete();
    });
  });

  describe('Client Validation', () => {
    it('should not call createExpansion when name is empty', () => {
      component.onSubmit();
      expect(mockExpansionService.createExpansion).not.toHaveBeenCalled();
    });

    it('should show required error when name is dirty and empty', () => {
      component.form.controls.name.markAsDirty();
      component.form.controls.name.setValue('');
      fixture.detectChanges();

      const error = fixture.nativeElement.querySelector('.field-error');
      expect(error?.textContent?.trim()).toBe('Name is required.');
    });

    it('should show maxlength error when name exceeds 255 characters', () => {
      const longName = 'a'.repeat(256);
      component.form.controls.name.markAsDirty();
      component.form.controls.name.setValue(longName);
      fixture.detectChanges();

      const error = fixture.nativeElement.querySelector('.field-error');
      expect(error?.textContent?.trim()).toBe('Name must be 255 characters or fewer.');
    });

    it('should disable submit button when form is invalid', () => {
      const submitBtn = fixture.nativeElement.querySelector('.dialog-btn--submit') as HTMLButtonElement;
      expect(submitBtn.disabled).toBe(true);
    });

    it('should enable submit button when form is valid', () => {
      component.form.controls.name.setValue('Core Set');
      fixture.detectChanges();

      const submitBtn = fixture.nativeElement.querySelector('.dialog-btn--submit') as HTMLButtonElement;
      expect(submitBtn.disabled).toBe(false);
    });
  });

  describe('Happy Path', () => {
    it('should call createExpansion with correct body', () => {
      const newOption: ExpansionOption = { id: 42, name: 'Core Set' };
      mockExpansionService.createExpansion.mockReturnValue(of(newOption));

      component.form.controls.name.setValue('Core Set');
      component.form.controls.isPublished.setValue(true);
      component.onSubmit();

      expect(mockExpansionService.createExpansion).toHaveBeenCalledWith({
        name: 'Core Set',
        isPublished: true,
      });
    });

    it('should emit created with the returned ExpansionOption', () => {
      const newOption: ExpansionOption = { id: 42, name: 'Core Set' };
      mockExpansionService.createExpansion.mockReturnValue(of(newOption));

      let emitted: ExpansionOption | undefined;
      component.created.subscribe((v) => (emitted = v));

      component.form.controls.name.setValue('Core Set');
      component.onSubmit();

      expect(emitted).toEqual(newOption);
    });

    it('should reset the form after success', () => {
      const newOption: ExpansionOption = { id: 42, name: 'Core Set' };
      mockExpansionService.createExpansion.mockReturnValue(of(newOption));

      component.form.controls.name.setValue('Core Set');
      component.onSubmit();

      expect(component.form.controls.name.value).toBe('');
    });
  });

  describe('Backend Error', () => {
    it('should display inline error when service throws', () => {
      mockExpansionService.createExpansion.mockReturnValue(
        throwError(() => new Error('Server error')),
      );

      component.form.controls.name.setValue('Fail Set');
      component.onSubmit();
      fixture.detectChanges();

      const errorEl = fixture.nativeElement.querySelector('.backend-error') as HTMLElement;
      expect(errorEl).toBeTruthy();
      expect(errorEl.textContent?.trim()).toBe('Server error');
    });

    it('should keep dialog open on error', () => {
      mockExpansionService.createExpansion.mockReturnValue(
        throwError(() => new Error('Server error')),
      );

      let cancelledCount = 0;
      component.cancelled.subscribe(() => cancelledCount++);

      let createdCount = 0;
      component.created.subscribe(() => createdCount++);

      component.form.controls.name.setValue('Fail Set');
      component.onSubmit();

      expect(cancelledCount).toBe(0);
      expect(createdCount).toBe(0);
    });

    it('should re-enable the submit button after error', () => {
      mockExpansionService.createExpansion.mockReturnValue(
        throwError(() => new Error('Server error')),
      );

      component.form.controls.name.setValue('Fail Set');
      component.onSubmit();
      fixture.detectChanges();

      const submitBtn = fixture.nativeElement.querySelector('.dialog-btn--submit') as HTMLButtonElement;
      expect(submitBtn.disabled).toBe(false);
    });
  });

  describe('Cancel Action', () => {
    it('should emit cancelled when cancel button is clicked', () => {
      let cancelledCount = 0;
      component.cancelled.subscribe(() => cancelledCount++);

      const cancelBtn = fixture.nativeElement.querySelector('.dialog-btn--cancel') as HTMLButtonElement;
      cancelBtn.click();

      expect(cancelledCount).toBe(1);
    });

    it('should not emit cancelled when processing', () => {
      const pending$ = new Subject<ExpansionOption>();
      mockExpansionService.createExpansion.mockReturnValue(pending$);

      component.form.controls.name.setValue('Test');
      component.onSubmit();

      let cancelledCount = 0;
      component.cancelled.subscribe(() => cancelledCount++);

      component.onCancel();
      expect(cancelledCount).toBe(0);
      pending$.complete();
    });
  });

  describe('Backdrop Click', () => {
    it('should emit cancelled when backdrop is clicked directly', () => {
      let cancelledCount = 0;
      component.cancelled.subscribe(() => cancelledCount++);

      const backdrop = fixture.nativeElement.querySelector('.dialog-backdrop') as HTMLElement;
      backdrop.click();

      expect(cancelledCount).toBe(1);
    });

    it('should not emit cancelled when dialog panel is clicked', () => {
      let cancelledCount = 0;
      component.cancelled.subscribe(() => cancelledCount++);

      const panel = fixture.nativeElement.querySelector('.dialog-panel') as HTMLElement;
      panel.click();

      expect(cancelledCount).toBe(0);
    });
  });

  describe('Escape Key', () => {
    it('should emit cancelled when Escape key is pressed', () => {
      let cancelledCount = 0;
      component.cancelled.subscribe(() => cancelledCount++);

      const backdrop = fixture.nativeElement.querySelector('.dialog-backdrop') as HTMLElement;
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      backdrop.dispatchEvent(event);

      expect(cancelledCount).toBe(1);
    });

    it('should not emit cancelled on Escape when processing', () => {
      const pending$ = new Subject<ExpansionOption>();
      mockExpansionService.createExpansion.mockReturnValue(pending$);

      component.form.controls.name.setValue('Test');
      component.onSubmit();

      let cancelledCount = 0;
      component.cancelled.subscribe(() => cancelledCount++);

      const backdrop = fixture.nativeElement.querySelector('.dialog-backdrop') as HTMLElement;
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      backdrop.dispatchEvent(event);

      expect(cancelledCount).toBe(0);
      pending$.complete();
    });

    it('should not emit cancelled on other keys', () => {
      let cancelledCount = 0;
      component.cancelled.subscribe(() => cancelledCount++);

      const backdrop = fixture.nativeElement.querySelector('.dialog-backdrop') as HTMLElement;
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      backdrop.dispatchEvent(event);

      expect(cancelledCount).toBe(0);
    });
  });

  describe('Accessibility', () => {
    it('should have role="dialog" on backdrop', () => {
      const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
      expect(dialog).toBeTruthy();
    });

    it('should have aria-modal="true"', () => {
      const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
      expect(dialog?.getAttribute('aria-modal')).toBe('true');
    });

    it('should have aria-label="Create Expansion"', () => {
      const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
      expect(dialog?.getAttribute('aria-label')).toBe('Create Expansion');
    });
  });
});
