import { Component, ChangeDetectionStrategy, inject, input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { CharacterFormField, CharacterSelections } from '../../models/create-character.model';
import { SelectionsSummary } from './components/selections-summary/selections-summary';

@Component({
  selector: 'app-character-form',
  imports: [ReactiveFormsModule, SelectionsSummary],
  templateUrl: './character-form.html',
  styleUrl: './character-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterForm {
  private readonly fb = inject(FormBuilder);

  readonly selections = input<CharacterSelections>({});

  readonly characterForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    pronouns: [''],
  });

  isFieldInvalid(fieldName: CharacterFormField): boolean {
    const control = this.characterForm.controls[fieldName];
    return control.invalid && control.touched;
  }
}
