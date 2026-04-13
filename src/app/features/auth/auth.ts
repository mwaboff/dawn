import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.html',
  styleUrl: './auth.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Auth {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly authError = signal<string | null>(null);
  readonly isLoading = signal(false);
  readonly isDev = !environment.production;
  readonly devEmail = signal('test@example.com');

  constructor() {
    const errorParam = this.route.snapshot.queryParamMap.get('error');
    if (errorParam) {
      this.authError.set('Sign-in failed. Please try again.');
    }
  }

  onGoogleLogin(): void {
    this.isLoading.set(true);
    this.authError.set(null);

    this.authService.loginWithGoogle().then(params => {
      if (params.error) {
        this.authError.set('Sign-in failed. Please try again.');
        this.isLoading.set(false);
        return;
      }

      this.authService.checkSession().subscribe(user => {
        this.isLoading.set(false);
        if (user && !user.usernameChosen) {
          this.router.navigate(['/choose-username']);
        } else {
          this.router.navigate(['/']);
        }
      });
    }).catch(() => {
      this.isLoading.set(false);
    });
  }

  onDevLogin(): void {
    this.isLoading.set(true);
    this.authError.set(null);

    this.authService.devLogin({ email: this.devEmail() }).subscribe({
      next: (user) => {
        this.isLoading.set(false);
        if (!user.usernameChosen) {
          this.router.navigate(['/choose-username']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.authError.set('Dev login failed.');
      }
    });
  }
}
