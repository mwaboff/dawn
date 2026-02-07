import { Component, ChangeDetectionStrategy, signal, computed, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown)': 'onKeydown($event)'
  }
})
export class Navbar {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly isBrowser: boolean;
  readonly authService = inject(AuthService);

  readonly scrollY = signal(0);
  readonly isScrolled = computed(() => this.scrollY() > 10);
  readonly isDropdownOpen = signal(false);

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.scrollY.set(window.scrollY);

      const handleScroll = () => {
        this.scrollY.set(window.scrollY);
      };

      window.addEventListener('scroll', handleScroll, { passive: true });

      effect(() => {
        this.scrollY();
      });
    }
  }

  toggleDropdown(): void {
    this.isDropdownOpen.update(open => !open);
  }

  closeDropdown(): void {
    this.isDropdownOpen.set(false);
  }

  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const dropdownContainer = target.closest('.nav-create-container');
    if (!dropdownContainer && this.isDropdownOpen()) {
      this.closeDropdown();
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isDropdownOpen()) {
      this.closeDropdown();
    }
  }

  onCreateCharacter(): void {
    this.router.navigate(['/create-character']);
    this.closeDropdown();
  }

  onLogout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/']),
      error: () => this.router.navigate(['/'])
    });
  }

  onProfile(): void {
    // TODO: Implement profile navigation
  }
}
