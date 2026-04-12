import { Component, ChangeDetectionStrategy, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
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
  readonly isUserMenuOpen = signal(false);
  readonly userInitial = computed(() => {
    const username = this.authService.user()?.username;
    return username ? username.charAt(0).toUpperCase() : '';
  });

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.scrollY.set(window.scrollY);

      const handleScroll = () => {
        this.scrollY.set(window.scrollY);
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
    }
  }

  toggleDropdown(): void {
    this.isDropdownOpen.update(open => !open);
  }

  closeDropdown(): void {
    this.isDropdownOpen.set(false);
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen.update(open => !open);
  }

  closeUserMenu(): void {
    this.isUserMenuOpen.set(false);
  }

  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (this.isDropdownOpen() && !target.closest('.nav-create-container')) {
      this.closeDropdown();
    }
    if (this.isUserMenuOpen() && !target.closest('.nav-user-container')) {
      this.closeUserMenu();
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return;
    if (this.isDropdownOpen()) this.closeDropdown();
    if (this.isUserMenuOpen()) this.closeUserMenu();
  }

  onCreateCharacter(): void {
    this.closeDropdown();
    this.router.navigate(['/create-character']);
  }

  onCreateCampaign(): void {
    this.closeDropdown();
    this.router.navigate(['/campaigns/create']);
  }

  onLogout(): void {
    this.closeUserMenu();
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/']),
      error: (err) => { console.error('Logout failed:', err); this.router.navigate(['/']); }
    });
  }

}
