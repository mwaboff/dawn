import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';

import { CharacterForm } from './character-form';

describe('CharacterForm', () => {
  let component: CharacterForm;
  let fixture: ComponentFixture<CharacterForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CharacterForm, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(CharacterForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should initialize form with empty name and pronouns', () => {
      expect(component.characterForm.value).toEqual({
        name: '',
        pronouns: '',
      });
    });
  });

  describe('Form Validation', () => {
    it('should mark name as invalid when empty and touched', () => {
      const nameControl = component.characterForm.controls.name;
      nameControl.markAsTouched();
      fixture.detectChanges();
      expect(component.isFieldInvalid('name')).toBe(true);
    });

    it('should mark name as valid when filled', () => {
      const nameControl = component.characterForm.controls.name;
      nameControl.setValue('Aragorn');
      nameControl.markAsTouched();
      fixture.detectChanges();
      expect(component.isFieldInvalid('name')).toBe(false);
    });

    it('should mark pronouns as invalid when empty and touched', () => {
      const pronounsControl = component.characterForm.controls.pronouns;
      pronounsControl.markAsTouched();
      fixture.detectChanges();
      expect(component.isFieldInvalid('pronouns')).toBe(true);
    });

    it('should mark pronouns as valid when filled', () => {
      const pronounsControl = component.characterForm.controls.pronouns;
      pronounsControl.setValue('he/him');
      pronounsControl.markAsTouched();
      fixture.detectChanges();
      expect(component.isFieldInvalid('pronouns')).toBe(false);
    });

    it('should have form invalid when both fields are empty', () => {
      expect(component.characterForm.valid).toBe(false);
    });

    it('should have form valid when both fields are filled', () => {
      component.characterForm.patchValue({
        name: 'Legolas',
        pronouns: 'he/him',
      });
      expect(component.characterForm.valid).toBe(true);
    });

    it('should not show validation errors when fields are untouched', () => {
      expect(component.isFieldInvalid('name')).toBe(false);
      expect(component.isFieldInvalid('pronouns')).toBe(false);
    });
  });

  describe('Template Rendering', () => {
    it('should render name input field', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const nameInput = compiled.querySelector('#character-name');
      expect(nameInput).toBeTruthy();
    });

    it('should render pronouns input field', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const pronounsInput = compiled.querySelector('#character-pronouns');
      expect(pronounsInput).toBeTruthy();
    });

    it('should show error message for name when invalid', () => {
      component.characterForm.controls.name.markAsTouched();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const errorMessage = compiled.querySelector('#name-error');
      expect(errorMessage?.textContent?.trim()).toBe('Character name is required');
    });

    it('should show error message for pronouns when invalid', () => {
      component.characterForm.controls.pronouns.markAsTouched();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const errorMessage = compiled.querySelector('#pronouns-error');
      expect(errorMessage?.textContent?.trim()).toBe('Pronouns are required');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-invalid on invalid name input', () => {
      component.characterForm.controls.name.markAsTouched();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const nameInput = compiled.querySelector('#character-name');
      expect(nameInput?.getAttribute('aria-invalid')).toBe('true');
    });

    it('should have aria-invalid on invalid pronouns input', () => {
      component.characterForm.controls.pronouns.markAsTouched();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const pronounsInput = compiled.querySelector('#character-pronouns');
      expect(pronounsInput?.getAttribute('aria-invalid')).toBe('true');
    });

    it('should have aria-describedby linking to error message when name is invalid', () => {
      component.characterForm.controls.name.markAsTouched();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const nameInput = compiled.querySelector('#character-name');
      expect(nameInput?.getAttribute('aria-describedby')).toBe('name-error');
    });

    it('should have aria-describedby linking to error message when pronouns are invalid', () => {
      component.characterForm.controls.pronouns.markAsTouched();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const pronounsInput = compiled.querySelector('#character-pronouns');
      expect(pronounsInput?.getAttribute('aria-describedby')).toBe('pronouns-error');
    });

    it('should have role="alert" on error messages', () => {
      component.characterForm.controls.name.markAsTouched();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const errorMessage = compiled.querySelector('#name-error');
      expect(errorMessage?.getAttribute('role')).toBe('alert');
    });
  });

  describe('User Interactions', () => {
    it('should update form value when name is typed', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const nameInput = compiled.querySelector('#character-name') as HTMLInputElement;

      nameInput.value = 'Gandalf';
      nameInput.dispatchEvent(new Event('input'));

      expect(component.characterForm.controls.name.value).toBe('Gandalf');
    });

    it('should update form value when pronouns are typed', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const pronounsInput = compiled.querySelector('#character-pronouns') as HTMLInputElement;

      pronounsInput.value = 'they/them';
      pronounsInput.dispatchEvent(new Event('input'));

      expect(component.characterForm.controls.pronouns.value).toBe('they/them');
    });
  });
});
