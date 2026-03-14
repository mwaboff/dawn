import { Component, ChangeDetectionStrategy, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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

  readonly nameChanged = output<string>();
  readonly pronounsChanged = output<string>();

  readonly characterForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    pronouns: [''],
  });

  constructor() {
    this.characterForm.controls.name.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(name => this.nameChanged.emit(name));

    this.characterForm.controls.pronouns.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(pronouns => this.pronounsChanged.emit(pronouns));
  }

  isFieldInvalid(fieldName: CharacterFormField): boolean {
    const control = this.characterForm.controls[fieldName];
    return control.invalid && control.touched;
  }
}
