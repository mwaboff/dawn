import { Component, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

type AuthTab = 'login' | 'signup';

@Component({
  selector: 'app-auth',
  imports: [ReactiveFormsModule],
  templateUrl: './auth.html',
  styleUrl: './auth.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Auth {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly activeTab = signal<AuthTab>('login');
  readonly loginError = signal<string | null>(null);
  readonly signupError = signal<string | null>(null);
  readonly isLoading = signal(false);
  readonly confirmPasswordTouched = signal(false);

  readonly title = computed(() =>
    this.activeTab() === 'login' ? 'Welcome Back' : 'Join the Adventure'
  );

  readonly subtitle = computed(() =>
    this.activeTab() === 'login'
      ? 'Sign in to continue your adventure'
      : 'Create an account to begin your journey'
  );

  readonly loginForm: FormGroup;
  readonly signupForm: FormGroup;

  constructor() {
    this.loginForm = this.fb.group({
      usernameOrEmail: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });

    this.signupForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[a-zA-Z0-9_-]+$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  setTab(tab: AuthTab): void {
    this.activeTab.set(tab);
    this.loginError.set(null);
    this.signupError.set(null);
    this.confirmPasswordTouched.set(false);
  }

  onConfirmPasswordBlur(): void {
    this.confirmPasswordTouched.set(true);
  }

  get showPasswordMismatch(): boolean {
    return this.confirmPasswordTouched() &&
           this.signupForm.hasError('passwordMismatch') &&
           this.signupForm.get('confirmPassword')?.value !== '';
  }

  onLogin(): void {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.loginError.set(null);

      this.authService.login(this.loginForm.value).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/']);
        },
        error: () => {
          this.isLoading.set(false);
          this.loginError.set('Login failed. Please check your credentials and try again.');
        }
      });
    }
  }

  onSignup(): void {
    if (this.signupForm.valid) {
      this.isLoading.set(true);
      this.signupError.set(null);

      const formValue = this.signupForm.value;
      this.authService.register({
        username: formValue.username,
        email: formValue.email,
        password: formValue.password
      }).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/']);
        },
        error: () => {
          this.isLoading.set(false);
          this.signupError.set('Registration failed. Please try again.');
        }
      });
    }
  }
}
