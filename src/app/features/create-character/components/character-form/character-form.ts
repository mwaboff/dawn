import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { CharacterFormField } from '../../models/create-character.model';

@Component({
  selector: 'app-character-form',
  imports: [ReactiveFormsModule],
  templateUrl: './character-form.html',
  styleUrl: './character-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterForm {
  private readonly fb = inject(FormBuilder);

  readonly characterForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    pronouns: ['', [Validators.required]],
  });

  isFieldInvalid(fieldName: CharacterFormField): boolean {
    const control = this.characterForm.controls[fieldName];
    return control.invalid && control.touched;
  }
}
