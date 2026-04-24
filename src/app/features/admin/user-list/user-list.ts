import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminUserService } from '../services/admin-user.service';
import {
  AdminUserSummary,
  AdminUserListParams,
  UserRole,
  isBanned,
} from '../models/admin-user.model';

const DEFAULT_SORT = 'lastSeenAt';
const PAGE_SIZE = 50;

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.html',
  styleUrl: './user-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
})
export class UserList implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly adminUserService = inject(AdminUserService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  readonly users = signal<AdminUserSummary[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly totalElements = signal(0);

  readonly filtersForm = this.fb.nonNullable.group({
    username: [''],
    role: [''],
    banStatus: [''],
    sort: [DEFAULT_SORT],
    ascending: [false],
  });

  readonly roleOptions: { value: UserRole | ''; label: string }[] = [
    { value: '', label: 'Any role' },
    { value: 'USER', label: 'User' },
    { value: 'MODERATOR', label: 'Moderator' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'OWNER', label: 'Owner' },
  ];

  readonly banOptions = [
    { value: '', label: 'All users' },
    { value: 'active', label: 'Active only' },
    { value: 'banned', label: 'Banned only' },
  ];

  readonly sortOptions = [
    { value: 'lastSeenAt', label: 'Last seen' },
    { value: 'createdAt', label: 'Join date' },
    { value: 'username', label: 'Username' },
    { value: 'id', label: 'User ID' },
  ];

  readonly showingRange = computed(() => {
    const total = this.totalElements();
    const shown = this.users().length;
    return `Showing ${shown} of ${total}`;
  });

  ngOnInit(): void {
    this.filtersForm.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page.set(0);
        this.load();
      });

    this.load();
  }

  onPrev(): void {
    if (this.page() > 0) {
      this.page.update(p => p - 1);
      this.load();
    }
  }

  onNext(): void {
    if (this.page() < this.totalPages() - 1) {
      this.page.update(p => p + 1);
      this.load();
    }
  }

  onEdit(id: number): void {
    this.router.navigate(['/admin/users', id]);
  }

  onViewProfile(id: number): void {
    if (isPlatformBrowser(this.platformId)) {
      window.open(`/profile/${id}`, '_blank', 'noopener');
    }
  }

  avatarInitial(username: string): string {
    return (username?.[0] ?? '?').toUpperCase();
  }

  readonly isUserBanned = isBanned;

  formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString();
  }

  trackById(_index: number, user: AdminUserSummary): number {
    return user.id;
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);

    const raw = this.filtersForm.getRawValue();
    const params: AdminUserListParams = {
      page: this.page(),
      size: PAGE_SIZE,
      sort: raw.sort || DEFAULT_SORT,
      ascending: raw.ascending,
    };
    if (raw.username.trim()) params.username = raw.username.trim();
    if (raw.role) params.role = raw.role as UserRole;
    if (raw.banStatus === 'banned') params.isBanned = true;
    if (raw.banStatus === 'active') params.isBanned = false;

    this.adminUserService.listUsers(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          this.users.set(resp.content);
          this.totalPages.set(resp.totalPages);
          this.totalElements.set(resp.totalElements);
          this.page.set(resp.currentPage);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message ?? 'Failed to load users.');
          this.loading.set(false);
        },
      });
  }
}
