# Character Builder Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a multi-tab character creation form for Daggerheart, accessible via a navbar dropdown menu.

**Architecture:** Navbar gets a dropdown component with click-outside detection. Create-character page uses a single reactive form spanning 9 tabs, with folder-divider styling on desktop and slide-out drawer on mobile. Form validates all tabs on submit.

**Tech Stack:** Angular 21 (standalone components, signals, reactive forms), TypeScript, CSS custom properties

---

## Task 1: Add Dropdown to Navbar

**Files:**
- Modify: `src/app/navbar/navbar.ts`
- Modify: `src/app/navbar/navbar.html`
- Modify: `src/app/navbar/navbar.css`
- Modify: `src/app/navbar/navbar.spec.ts`

**Step 1: Write failing tests for dropdown functionality**

Add these tests to `src/app/navbar/navbar.spec.ts`:

```typescript
describe('dropdown', () => {
  it('should start with dropdown closed', () => {
    fixture.detectChanges();
    expect(component.isDropdownOpen()).toBe(false);
  });

  it('should toggle dropdown when plus button is clicked', () => {
    fixture.detectChanges();
    component.toggleDropdown();
    expect(component.isDropdownOpen()).toBe(true);
    component.toggleDropdown();
    expect(component.isDropdownOpen()).toBe(false);
  });

  it('should close dropdown when closeDropdown is called', () => {
    fixture.detectChanges();
    component.isDropdownOpen.set(true);
    component.closeDropdown();
    expect(component.isDropdownOpen()).toBe(false);
  });

  it('should navigate to create-character and close dropdown when onCreateCharacter is called', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.isDropdownOpen.set(true);

    component.onCreateCharacter();

    expect(navigateSpy).toHaveBeenCalledWith(['/create-character']);
    expect(component.isDropdownOpen()).toBe(false);
  });

  it('should render plus button when logged in', () => {
    vi.spyOn(authService, 'isLoggedIn').mockReturnValue(true);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const plusButton = compiled.querySelector('.nav-create-btn');
    expect(plusButton).toBeTruthy();
  });

  it('should not render plus button when logged out', () => {
    vi.spyOn(authService, 'isLoggedIn').mockReturnValue(false);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const plusButton = compiled.querySelector('.nav-create-btn');
    expect(plusButton).toBeFalsy();
  });

  it('should show dropdown menu when open', () => {
    vi.spyOn(authService, 'isLoggedIn').mockReturnValue(true);
    fixture.detectChanges();
    component.isDropdownOpen.set(true);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const dropdown = compiled.querySelector('.nav-dropdown');
    expect(dropdown).toBeTruthy();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --run`

Expected: FAIL - `isDropdownOpen` not defined, `toggleDropdown` not defined, etc.

**Step 3: Add dropdown state and methods to navbar.ts**

Update `src/app/navbar/navbar.ts`:

```typescript
import { Component, ChangeDetectionStrategy, signal, computed, effect, inject, PLATFORM_ID, HostListener } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)'
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
    this.isDropdownOpen.update(v => !v);
  }

  closeDropdown(): void {
    this.isDropdownOpen.set(false);
  }

  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.nav-create-wrapper')) {
      this.closeDropdown();
    }
  }

  onCreateCharacter(): void {
    this.closeDropdown();
    this.router.navigate(['/create-character']);
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
```

**Step 4: Update navbar.html with dropdown markup**

Replace `src/app/navbar/navbar.html`:

```html
<nav class="nav" [class.scrolled]="isScrolled()">
  <div class="nav-container">
    <a href="/" class="nav-logo" aria-label="Oh Sheet Home">
      Oh Sheet
    </a>
    <div class="nav-links">
      @if (authService.isLoggedIn()) {
        <div class="nav-create-wrapper">
          <button
            type="button"
            class="nav-create-btn"
            (click)="toggleDropdown()"
            [attr.aria-expanded]="isDropdownOpen()"
            aria-haspopup="true"
            aria-label="Create menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M10 4V16M4 10H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
          @if (isDropdownOpen()) {
            <div class="nav-dropdown" role="menu">
              <button
                type="button"
                class="nav-dropdown-item"
                role="menuitem"
                (click)="onCreateCharacter()"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="8" cy="4" r="3" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M2 14C2 11.2386 4.23858 9 7 9H9C11.7614 9 14 11.2386 14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                Create Character
              </button>
            </div>
          }
        </div>
        <button type="button" class="nav-link" (click)="onProfile()">Profile</button>
        <button type="button" class="nav-link nav-link-secondary" (click)="onLogout()">Logout</button>
      } @else {
        <a href="/auth" class="nav-link nav-link-auth">Login / Sign Up</a>
      }
    </div>
  </div>
</nav>
```

**Step 5: Add dropdown styles to navbar.css**

Add to `src/app/navbar/navbar.css`:

```css
/* Create Button & Dropdown */
.nav-create-wrapper {
  position: relative;
}

.nav-create-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: 1px solid rgba(212, 160, 86, 0.4);
  border-radius: 4px;
  color: var(--color-parchment);
  cursor: pointer;
  transition: all 0.3s ease;
}

.nav-create-btn:hover {
  background: rgba(212, 160, 86, 0.1);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.nav-create-btn:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.nav-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 180px;
  background: var(--color-bg-dark);
  border: 1px solid rgba(212, 160, 86, 0.3);
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  z-index: 200;
}

.nav-dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  font-family: var(--font-display);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-parchment);
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-dropdown-item:hover {
  background: rgba(212, 160, 86, 0.15);
  color: var(--color-accent);
}

.nav-dropdown-item:focus-visible {
  outline: none;
  background: rgba(212, 160, 86, 0.15);
  color: var(--color-accent);
}

.nav-dropdown-item svg {
  flex-shrink: 0;
}
```

**Step 6: Run tests to verify they pass**

Run: `npm test -- --run`

Expected: All navbar tests PASS

**Step 7: Commit**

```bash
git add src/app/navbar/
git commit -m "feat(navbar): add create dropdown with character option

Add + button to navbar that opens dropdown menu when logged in.
Dropdown closes on click outside or option selection.
Create Character option navigates to /create-character."
```

---

## Task 2: Add Create Character Route

**Files:**
- Modify: `src/app/app.routes.ts`
- Modify: `src/app/app.routes.spec.ts`

**Step 1: Write failing test for the route**

Add to `src/app/app.routes.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { routes } from './app.routes';

describe('App Routes', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    router = TestBed.inject(Router);
  });

  it('should have create-character route', () => {
    const createCharRoute = router.config[0]?.children?.find(
      r => r.path === 'create-character'
    );
    expect(createCharRoute).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run`

Expected: FAIL - route not found

**Step 3: Add route to app.routes.ts**

Update `src/app/app.routes.ts`:

```typescript
import { Routes } from '@angular/router';
import { authSessionGuard } from './auth/auth-session.guard';

export const routes: Routes = [
  {
    path: '',
    canActivateChild: [authSessionGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./home/home').then(m => m.Home)
      },
      {
        path: 'auth',
        loadComponent: () => import('./auth/auth').then(m => m.Auth)
      },
      {
        path: 'create-character',
        loadComponent: () => import('./create-character/create-character').then(m => m.CreateCharacter)
      }
    ]
  }
];
```

**Step 4: Run test (will still fail until component exists)**

Run: `npm test -- --run`

Expected: FAIL - component not found (expected, we create it next task)

**Step 5: Commit route change**

```bash
git add src/app/app.routes.ts src/app/app.routes.spec.ts
git commit -m "feat(routes): add create-character route

Route is lazy-loaded and protected by authSessionGuard."
```

---

## Task 3: Create Base Create-Character Component

**Files:**
- Create: `src/app/create-character/create-character.ts`
- Create: `src/app/create-character/create-character.html`
- Create: `src/app/create-character/create-character.css`
- Create: `src/app/create-character/create-character.spec.ts`

**Step 1: Write initial component tests**

Create `src/app/create-character/create-character.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CreateCharacter } from './create-character';

describe('CreateCharacter', () => {
  let component: CreateCharacter;
  let fixture: ComponentFixture<CreateCharacter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateCharacter],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateCharacter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('tabs', () => {
    it('should have 9 tabs', () => {
      expect(component.tabs.length).toBe(9);
    });

    it('should start with Class tab active', () => {
      expect(component.activeTab()).toBe('class');
    });

    it('should change active tab when setActiveTab is called', () => {
      component.setActiveTab('heritage');
      expect(component.activeTab()).toBe('heritage');
    });

    it('should have correct tab order', () => {
      const tabIds = component.tabs.map(t => t.id);
      expect(tabIds).toEqual([
        'class', 'heritage', 'traits', 'additional-info',
        'starting-equipment', 'background', 'experiences',
        'domain-cards', 'connections'
      ]);
    });
  });

  describe('mobile drawer', () => {
    it('should start with drawer closed', () => {
      expect(component.isDrawerOpen()).toBe(false);
    });

    it('should toggle drawer', () => {
      component.toggleDrawer();
      expect(component.isDrawerOpen()).toBe(true);
      component.toggleDrawer();
      expect(component.isDrawerOpen()).toBe(false);
    });

    it('should close drawer when selecting a tab', () => {
      component.isDrawerOpen.set(true);
      component.selectTabFromDrawer('traits');
      expect(component.isDrawerOpen()).toBe(false);
      expect(component.activeTab()).toBe('traits');
    });
  });

  describe('form', () => {
    it('should have characterForm defined', () => {
      expect(component.characterForm).toBeDefined();
    });

    it('should have name field', () => {
      expect(component.characterForm.get('name')).toBeTruthy();
    });

    it('should have pronouns field', () => {
      expect(component.characterForm.get('pronouns')).toBeTruthy();
    });

    it('should require name field', () => {
      const nameControl = component.characterForm.get('name');
      nameControl?.setValue('');
      expect(nameControl?.valid).toBe(false);
      nameControl?.setValue('Test Character');
      expect(nameControl?.valid).toBe(true);
    });

    it('should require pronouns field', () => {
      const pronounsControl = component.characterForm.get('pronouns');
      pronounsControl?.setValue('');
      expect(pronounsControl?.valid).toBe(false);
      pronounsControl?.setValue('they/them');
      expect(pronounsControl?.valid).toBe(true);
    });
  });

  describe('rendering', () => {
    it('should render parchment container', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const container = compiled.querySelector('.character-form-container');
      expect(container).toBeTruthy();
    });

    it('should render name input', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const nameInput = compiled.querySelector('input[formControlName="name"]');
      expect(nameInput).toBeTruthy();
    });

    it('should render pronouns input', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const pronounsInput = compiled.querySelector('input[formControlName="pronouns"]');
      expect(pronounsInput).toBeTruthy();
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --run`

Expected: FAIL - component doesn't exist

**Step 3: Create the component TypeScript file**

Create `src/app/create-character/create-character.ts`:

```typescript
import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

export type TabId =
  | 'class'
  | 'heritage'
  | 'traits'
  | 'additional-info'
  | 'starting-equipment'
  | 'background'
  | 'experiences'
  | 'domain-cards'
  | 'connections';

export interface Tab {
  id: TabId;
  label: string;
}

@Component({
  selector: 'app-create-character',
  imports: [ReactiveFormsModule],
  templateUrl: './create-character.html',
  styleUrl: './create-character.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateCharacter {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly tabs: Tab[] = [
    { id: 'class', label: 'Class' },
    { id: 'heritage', label: 'Heritage' },
    { id: 'traits', label: 'Traits' },
    { id: 'additional-info', label: 'Additional Info' },
    { id: 'starting-equipment', label: 'Starting Equipment' },
    { id: 'background', label: 'Background' },
    { id: 'experiences', label: 'Experiences' },
    { id: 'domain-cards', label: 'Domain Cards' },
    { id: 'connections', label: 'Connections' }
  ];

  readonly activeTab = signal<TabId>('class');
  readonly isDrawerOpen = signal(false);
  readonly hasAttemptedSubmit = signal(false);

  readonly characterForm: FormGroup;

  constructor() {
    this.characterForm = this.fb.group({
      name: ['', [Validators.required]],
      pronouns: ['', [Validators.required]],
      // Tab fields will be added in subsequent tasks
      characterClass: [''],
      subclass: [''],
      heritage: [''],
      community: ['']
    });
  }

  setActiveTab(tabId: TabId): void {
    this.activeTab.set(tabId);
  }

  toggleDrawer(): void {
    this.isDrawerOpen.update(v => !v);
  }

  closeDrawer(): void {
    this.isDrawerOpen.set(false);
  }

  selectTabFromDrawer(tabId: TabId): void {
    this.setActiveTab(tabId);
    this.closeDrawer();
  }

  getActiveTabLabel(): string {
    const tab = this.tabs.find(t => t.id === this.activeTab());
    return tab?.label ?? '';
  }

  onSubmit(): void {
    this.hasAttemptedSubmit.set(true);
    if (this.characterForm.valid) {
      // TODO: Submit to API
      console.log('Form submitted:', this.characterForm.value);
    }
  }
}
```

**Step 4: Create the component template**

Create `src/app/create-character/create-character.html`:

```html
<div class="create-character-page">
  <div class="character-form-container">
    <!-- Mobile Header -->
    <div class="mobile-header">
      <span class="mobile-current-tab">{{ getActiveTabLabel() }}</span>
      <button
        type="button"
        class="mobile-menu-btn"
        (click)="toggleDrawer()"
        [attr.aria-expanded]="isDrawerOpen()"
        aria-label="Open tab menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <!-- Mobile Drawer -->
    @if (isDrawerOpen()) {
      <div class="drawer-backdrop" (click)="closeDrawer()"></div>
      <div class="drawer" role="menu" aria-label="Tab navigation">
        <div class="drawer-header">
          <span>Sections</span>
          <button
            type="button"
            class="drawer-close-btn"
            (click)="closeDrawer()"
            aria-label="Close menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        @for (tab of tabs; track tab.id) {
          <button
            type="button"
            class="drawer-item"
            [class.active]="activeTab() === tab.id"
            role="menuitem"
            (click)="selectTabFromDrawer(tab.id)"
          >
            {{ tab.label }}
          </button>
        }
      </div>
    }

    <form [formGroup]="characterForm" (ngSubmit)="onSubmit()" class="character-form">
      <!-- Header Fields (Always Visible) -->
      <div class="form-header">
        <div class="form-group">
          <label for="name" class="form-label">Name</label>
          <input
            id="name"
            type="text"
            class="form-input"
            formControlName="name"
            placeholder="Character name"
            [class.input-error]="characterForm.get('name')?.invalid && characterForm.get('name')?.touched"
          />
          @if (characterForm.get('name')?.invalid && characterForm.get('name')?.touched) {
            <span class="field-error">Name is required</span>
          }
        </div>
        <div class="form-group">
          <label for="pronouns" class="form-label">Pronouns</label>
          <input
            id="pronouns"
            type="text"
            class="form-input"
            formControlName="pronouns"
            placeholder="e.g., they/them"
            [class.input-error]="characterForm.get('pronouns')?.invalid && characterForm.get('pronouns')?.touched"
          />
          @if (characterForm.get('pronouns')?.invalid && characterForm.get('pronouns')?.touched) {
            <span class="field-error">Pronouns are required</span>
          }
        </div>
      </div>

      <!-- Tab Content Area with Desktop Tabs -->
      <div class="form-body">
        <div class="tab-content">
          <!-- Content panels will be added in subsequent tasks -->
          @switch (activeTab()) {
            @case ('class') {
              <div class="tab-panel" role="tabpanel" aria-labelledby="tab-class">
                <h2 class="tab-title">Class</h2>
                <p class="tab-placeholder">Class selection coming soon...</p>
              </div>
            }
            @case ('heritage') {
              <div class="tab-panel" role="tabpanel" aria-labelledby="tab-heritage">
                <h2 class="tab-title">Heritage</h2>
                <p class="tab-placeholder">Heritage selection coming soon...</p>
              </div>
            }
            @case ('traits') {
              <div class="tab-panel" role="tabpanel" aria-labelledby="tab-traits">
                <h2 class="tab-title">Traits</h2>
                <p class="tab-placeholder">Trait allocation coming soon...</p>
              </div>
            }
            @case ('additional-info') {
              <div class="tab-panel" role="tabpanel" aria-labelledby="tab-additional-info">
                <h2 class="tab-title">Additional Info</h2>
                <p class="tab-placeholder">Additional info coming soon...</p>
              </div>
            }
            @case ('starting-equipment') {
              <div class="tab-panel" role="tabpanel" aria-labelledby="tab-starting-equipment">
                <h2 class="tab-title">Starting Equipment</h2>
                <p class="tab-placeholder">Equipment selection coming soon...</p>
              </div>
            }
            @case ('background') {
              <div class="tab-panel" role="tabpanel" aria-labelledby="tab-background">
                <h2 class="tab-title">Background</h2>
                <p class="tab-placeholder">Background entry coming soon...</p>
              </div>
            }
            @case ('experiences') {
              <div class="tab-panel" role="tabpanel" aria-labelledby="tab-experiences">
                <h2 class="tab-title">Experiences</h2>
                <p class="tab-placeholder">Experiences list coming soon...</p>
              </div>
            }
            @case ('domain-cards') {
              <div class="tab-panel" role="tabpanel" aria-labelledby="tab-domain-cards">
                <h2 class="tab-title">Domain Cards</h2>
                <p class="tab-placeholder">Domain card selection coming soon...</p>
              </div>
            }
            @case ('connections') {
              <div class="tab-panel" role="tabpanel" aria-labelledby="tab-connections">
                <h2 class="tab-title">Connections</h2>
                <p class="tab-placeholder">Connections list coming soon...</p>
              </div>
            }
          }
        </div>

        <!-- Desktop Folder Tabs -->
        <div class="folder-tabs" role="tablist" aria-label="Character sections">
          @for (tab of tabs; track tab.id; let i = $index) {
            <button
              type="button"
              class="folder-tab"
              [class.active]="activeTab() === tab.id"
              [style.--tab-index]="i"
              role="tab"
              [id]="'tab-' + tab.id"
              [attr.aria-selected]="activeTab() === tab.id"
              [attr.aria-controls]="'panel-' + tab.id"
              (click)="setActiveTab(tab.id)"
            >
              {{ tab.label }}
            </button>
          }
        </div>
      </div>

      <!-- Submit Button -->
      <div class="form-footer">
        <button type="submit" class="submit-btn">
          Create Character
        </button>
      </div>
    </form>
  </div>
</div>
```

**Step 5: Create the component styles**

Create `src/app/create-character/create-character.css`:

```css
.create-character-page {
  min-height: 100vh;
  padding: 6rem 1rem 2rem;
  background: var(--color-bg-dark);
  display: flex;
  justify-content: center;
}

.character-form-container {
  width: 100%;
  max-width: 900px;
  background: var(--color-parchment);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  position: relative;
  color: var(--color-text-dark);
}

/* Mobile Header */
.mobile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(45, 36, 31, 0.15);
  background: rgba(45, 36, 31, 0.05);
}

.mobile-current-tab {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-dark);
}

.mobile-menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: transparent;
  border: 1px solid rgba(45, 36, 31, 0.2);
  border-radius: 4px;
  color: var(--color-text-dark);
  cursor: pointer;
  transition: all 0.2s ease;
}

.mobile-menu-btn:hover {
  background: rgba(45, 36, 31, 0.1);
}

.mobile-menu-btn:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Drawer */
.drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 100;
}

.drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 280px;
  max-width: 80vw;
  background: var(--color-parchment);
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.3);
  z-index: 101;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.2s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(45, 36, 31, 0.15);
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-dark);
}

.drawer-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  color: var(--color-text-dark);
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.drawer-close-btn:hover {
  background: rgba(45, 36, 31, 0.1);
}

.drawer-close-btn:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: -2px;
}

.drawer-item {
  padding: 1rem 1.5rem;
  background: transparent;
  border: none;
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text-dark);
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
}

.drawer-item:hover {
  background: rgba(45, 36, 31, 0.08);
}

.drawer-item.active {
  background: rgba(212, 160, 86, 0.15);
  border-left-color: var(--color-accent);
  color: var(--color-accent);
  font-weight: 600;
}

.drawer-item:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: -2px;
}

/* Form */
.character-form {
  display: flex;
  flex-direction: column;
}

.form-header {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(45, 36, 31, 0.1);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-family: var(--font-display);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-dark);
  letter-spacing: 0.03em;
}

.form-input {
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(45, 36, 31, 0.2);
  border-radius: 4px;
  font-family: var(--font-body);
  font-size: 1rem;
  color: var(--color-text-dark);
  transition: all 0.2s ease;
}

.form-input:hover {
  border-color: rgba(45, 36, 31, 0.35);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px rgba(212, 160, 86, 0.2);
}

.form-input::placeholder {
  color: var(--color-text-dark);
  opacity: 0.4;
}

.input-error {
  border-color: #dc2626;
}

.input-error:focus {
  border-color: #dc2626;
  box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.2);
}

.field-error {
  color: #dc2626;
  font-size: 0.75rem;
}

/* Form Body - Tab Area */
.form-body {
  display: flex;
  min-height: 400px;
}

.tab-content {
  flex: 1;
  padding: 1.5rem;
}

.tab-panel {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.tab-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-dark);
  margin-bottom: 1rem;
}

.tab-placeholder {
  color: var(--color-text-dark);
  opacity: 0.6;
  font-style: italic;
}

/* Desktop Folder Tabs */
.folder-tabs {
  display: none;
  flex-direction: column;
  padding: 1rem 0;
  width: 160px;
  flex-shrink: 0;
}

.folder-tab {
  position: relative;
  padding: 0.75rem 1rem 0.75rem 1.25rem;
  margin-right: -1px;
  background: rgba(45, 36, 31, 0.06);
  border: 1px solid rgba(45, 36, 31, 0.15);
  border-right: none;
  border-radius: 8px 0 0 8px;
  font-family: var(--font-display);
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-dark);
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  transform: translateX(calc(var(--tab-index) * 4px));
  box-shadow: -2px 2px 4px rgba(0, 0, 0, 0.08);
}

.folder-tab:hover {
  background: rgba(212, 160, 86, 0.12);
  transform: translateX(calc(var(--tab-index) * 4px - 4px));
}

.folder-tab.active {
  background: var(--color-parchment);
  border-color: rgba(45, 36, 31, 0.2);
  color: var(--color-accent);
  font-weight: 600;
  z-index: 1;
  box-shadow: -4px 2px 8px rgba(0, 0, 0, 0.12);
  transform: translateX(calc(var(--tab-index) * 4px - 8px));
}

.folder-tab:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: -2px;
  z-index: 2;
}

/* Form Footer */
.form-footer {
  padding: 1.5rem;
  border-top: 1px solid rgba(45, 36, 31, 0.1);
  display: flex;
  justify-content: center;
}

.submit-btn {
  padding: 1rem 3rem;
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-bright) 100%);
  border: none;
  border-radius: 6px;
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-bg-dark);
  letter-spacing: 0.03em;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(212, 160, 86, 0.4);
}

.submit-btn:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 4px;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Responsive - Desktop */
@media (min-width: 1024px) {
  .create-character-page {
    padding: 6rem 2rem 2rem;
  }

  .character-form-container {
    max-width: 1000px;
  }

  .mobile-header {
    display: none;
  }

  .folder-tabs {
    display: flex;
  }

  .form-body {
    border-right: 1px solid rgba(45, 36, 31, 0.1);
  }

  .tab-content {
    padding: 2rem;
  }
}

/* Responsive - Mobile */
@media (max-width: 768px) {
  .create-character-page {
    padding: 5rem 0.75rem 1rem;
  }

  .form-header {
    grid-template-columns: 1fr;
    padding: 1rem;
  }

  .tab-content {
    padding: 1rem;
  }

  .form-footer {
    padding: 1rem;
  }

  .submit-btn {
    width: 100%;
  }
}
```

**Step 6: Run tests to verify they pass**

Run: `npm test -- --run`

Expected: All tests PASS

**Step 7: Commit**

```bash
git add src/app/create-character/ src/app/app.routes.ts src/app/app.routes.spec.ts
git commit -m "feat(create-character): add base component with tab navigation

- 9 section tabs with folder-divider styling on desktop
- Slide-out drawer navigation on mobile
- Name and Pronouns header fields with validation
- Parchment-colored form container with warm styling
- Placeholder content for each tab section"
```

---

## Task 4-12: Implement Individual Tab Sections

The remaining tasks follow the same TDD pattern for each tab. Due to plan length, these are summarized:

**Task 4:** Class tab - dropdown for class, dependent dropdown for subclass
**Task 5:** Heritage tab - dropdowns for heritage and community
**Task 6:** Traits tab - radio buttons for arrays, number inputs for customization
**Task 7:** Additional Info tab - age input, physical description textarea
**Task 8:** Starting Equipment tab - multi-select checklist
**Task 9:** Background tab - textarea with min length validation
**Task 10:** Experiences tab - dynamic list builder with add/remove
**Task 11:** Domain Cards tab - multi-select card grid
**Task 12:** Connections tab - dynamic list with name + relationship fields

Each task:
1. Write failing tests for tab fields and validation
2. Run tests to verify failure
3. Add form controls to characterForm
4. Update template with tab content
5. Add tab-specific styles if needed
6. Run tests to verify pass
7. Commit

---

## Task 13: Add Tab Error Indicators and Validation Summary

**Files:**
- Modify: `src/app/create-character/create-character.ts`
- Modify: `src/app/create-character/create-character.html`
- Modify: `src/app/create-character/create-character.css`
- Modify: `src/app/create-character/create-character.spec.ts`

**Step 1: Write tests for error indicators**

Add to spec file:

```typescript
describe('validation', () => {
  it('should show tab error indicators after submit attempt', () => {
    component.hasAttemptedSubmit.set(true);
    fixture.detectChanges();
    // Check that tabs with invalid fields show error indicator
    const errorTab = fixture.nativeElement.querySelector('.folder-tab.has-error');
    expect(errorTab).toBeTruthy();
  });

  it('should show error summary when form is invalid on submit', () => {
    component.onSubmit();
    fixture.detectChanges();
    const errorSummary = fixture.nativeElement.querySelector('.error-summary');
    expect(errorSummary).toBeTruthy();
  });

  it('should navigate to tab when clicking error summary item', () => {
    component.hasAttemptedSubmit.set(true);
    component.navigateToTabFromError('heritage');
    expect(component.activeTab()).toBe('heritage');
  });
});
```

**Step 2-6:** Implement error indicators, summary box, clickable navigation, run tests, commit.

---

## Task 14: Final Integration and Polish

**Files:**
- All create-character files
- Run full test suite

**Steps:**
1. Run all tests: `npm test -- --run`
2. Manual testing of tab navigation, form validation, responsive behavior
3. Accessibility check with keyboard navigation
4. Final commit with any polish

```bash
git add .
git commit -m "feat(create-character): complete character builder implementation

All 9 tabs functional with validation, error indicators, and responsive design.
Meets WCAG AA accessibility requirements."
```

---

**Plan complete and saved to `docs/plans/2026-02-01-character-builder-implementation.md`.**

**Two execution options:**

1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**