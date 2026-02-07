import { Component, signal, computed, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-create-character',
  imports: [ReactiveFormsModule],
  templateUrl: './create-character.html',
  styleUrl: './create-character.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateCharacter {
  private fb = inject(FormBuilder);

  // Mobile drawer state
  mobileDrawerOpen = signal(false);

  // Current active tab
  activeTab = signal('class');

  // Tab configuration
  tabs = [
    { id: 'class', label: 'Class' },
    { id: 'heritage', label: 'Heritage' },
    { id: 'traits', label: 'Traits' },
    { id: 'additional-info', label: 'Additional Info' },
    { id: 'starting-equipment', label: 'Starting Equipment' },
    { id: 'background', label: 'Background' },
    { id: 'experiences', label: 'Experiences' },
    { id: 'domain-cards', label: 'Domain Cards' },
    { id: 'connections', label: 'Connections' },
  ];

  // Character form
  characterForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(1)]],
    pronouns: ['', [Validators.required, Validators.minLength(1)]],
  });

  // Validation helper method
  isFieldInvalid(fieldName: 'name' | 'pronouns'): boolean {
    const control = this.characterForm.controls[fieldName];
    return control.invalid && control.touched;
  }

  toggleMobileDrawer(): void {
    this.mobileDrawerOpen.update((open) => !open);
  }

  closeMobileDrawer(): void {
    this.mobileDrawerOpen.set(false);
  }

  selectTab(tabId: string): void {
    this.activeTab.set(tabId);
    this.closeMobileDrawer();
  }
}
