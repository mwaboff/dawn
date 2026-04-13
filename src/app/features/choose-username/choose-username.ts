import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-choose-username',
  imports: [ReactiveFormsModule],
  templateUrl: './choose-username.html',
  styleUrl: './choose-username.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChooseUsername {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly usernameError = signal<string | null>(null);
  readonly isLoading = signal(false);

  readonly usernameForm = this.fb.nonNullable.group({
    username: ['', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(30),
      Validators.pattern(/^[a-zA-Z0-9_-]+$/)
    ]]
  });

  readonly usernameControl = this.usernameForm.controls.username;

  onSubmit(): void {
    if (this.usernameForm.valid) {
      this.isLoading.set(true);
      this.usernameError.set(null);

      this.authService.chooseUsername({
        username: this.usernameControl.value
      }).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/']);
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading.set(false);
          if (error.status === 409) {
            this.usernameError.set('That username is already taken. Try another.');
          } else if (error.status === 400) {
            const msg = error.error?.message || 'Invalid username. Use 3\u201330 characters: letters, numbers, underscores, or hyphens.';
            this.usernameError.set(msg);
          } else {
            this.usernameError.set('Something went wrong. Please try again.');
          }
        }
      });
    }
  }
}
