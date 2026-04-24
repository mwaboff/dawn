import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  DestroyRef,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { AdminUserService } from '../services/admin-user.service';
import {
  AdminUserDetailResponse,
  AdminUserPatchRequest,
  AdminUserRecord,
  UserRole,
  isBanned,
} from '../models/admin-user.model';
import { applyBackendErrors } from '../card-edit/utils/card-edit-form.utils';
import { UserEditToolbar } from './components/user-edit-toolbar/user-edit-toolbar';
import { UserEditIdentityPanel } from './components/user-edit-identity-panel/user-edit-identity-panel';
import { UserEditHistoryList, HistoryColumn } from './components/user-edit-history-list/user-edit-history-list';
import { UserEditPreview, UserPreviewData } from './components/user-edit-preview/user-edit-preview';

@Component({
  selector: 'app-user-edit',
  templateUrl: './user-edit.html',
  styleUrl: './user-edit.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    UserEditToolbar,
    UserEditIdentityPanel,
    UserEditHistoryList,
    UserEditPreview,
  ],
})
export class UserEdit implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly adminUserService = inject(AdminUserService);

  readonly userId = signal(0);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly processingBan = signal(false);
  readonly error = signal<string | null>(null);
  readonly saveSuccess = signal(false);
  readonly submitted = signal(false);
  readonly toast = signal<string | null>(null);
  readonly detail = signal<AdminUserDetailResponse | null>(null);
  private readonly formVersion = signal(0);

  readonly form: FormGroup = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    avatarUrl: ['', [Validators.maxLength(500)]],
    role: ['USER' as UserRole],
  });

  readonly user = computed<AdminUserRecord | null>(() => this.detail()?.user ?? null);
  readonly userIsBanned = computed(() => { const u = this.user(); return u ? isBanned(u) : false; });

  readonly hasPendingChanges = computed(() => {
    this.formVersion();
    return this.form.dirty;
  });

  readonly previewData = computed<UserPreviewData | null>(() => {
    this.formVersion();
    const u = this.user();
    if (!u) return null;
    const value = this.form.getRawValue();
    return {
      username: value.username || u.username,
      avatarUrl: value.avatarUrl || u.avatarUrl || null,
      role: value.role as UserRole,
      banned: isBanned(u),
      banReason: u.banReason,
      email: u.email,
      lastSeenAt: u.lastSeenAt ? new Date(u.lastSeenAt).toLocaleString() : null,
    };
  });

  readonly loginColumns: HistoryColumn[] = [
    { key: 'createdAt', label: 'When' },
    { key: 'provider', label: 'Provider' },
    { key: 'ipAddress', label: 'IP' },
    { key: 'deviceInfo', label: 'Device' },
  ];

  readonly usernameColumns: HistoryColumn[] = [
    { key: 'changedAt', label: 'When' },
    { key: 'previousUsername', label: 'Previous' },
    { key: 'newUsername', label: 'New' },
    { key: 'changedByUsername', label: 'Changed by' },
  ];

  readonly actionColumns: HistoryColumn[] = [
    { key: 'createdAt', label: 'When' },
    { key: 'action', label: 'Action' },
    { key: 'actorUsername', label: 'Actor' },
    { key: 'details', label: 'Details' },
    { key: 'ipAddress', label: 'IP' },
  ];

  ngOnInit(): void {
    const id = Number(this.route.snapshot.params['userId']);
    this.userId.set(id);

    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.formVersion.update(v => v + 1));

    this.load();
  }

  loginEvents() { return this.detail()?.loginEvents ?? []; }
  usernameHistory() { return this.detail()?.usernameHistory ?? []; }
  adminActions() { return this.detail()?.adminActions ?? []; }
  identities() { return this.detail()?.identities ?? []; }

  onBack(): void {
    this.router.navigate(['/admin/users']);
  }

  onSave(): void {
    if (!this.form.dirty) return;
    this.submitted.set(true);
    if (this.form.invalid) return;

    const patch: AdminUserPatchRequest = {};
    const raw = this.form.getRawValue();
    const current = this.user();
    if (!current) return;

    if (raw.username !== current.username) patch.username = raw.username;
    const currentAvatar = current.avatarUrl ?? '';
    if ((raw.avatarUrl || '') !== currentAvatar) patch.avatarUrl = raw.avatarUrl ?? '';
    if (raw.role !== current.role) patch.role = raw.role as UserRole;

    if (Object.keys(patch).length === 0) {
      this.form.markAsPristine();
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.saveSuccess.set(false);

    this.adminUserService.updateUser(this.userId(), patch)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => this.handleDetailUpdate(resp, 'Saved successfully'),
        error: (err) => this.handleError(err, 'Save failed. Please try again.'),
      });
  }

  onBan(reason: string): void {
    this.runBan(this.adminUserService.banUser(this.userId(), reason || undefined), 'User banned');
  }

  onUnban(): void {
    this.runBan(this.adminUserService.unbanUser(this.userId()), 'User unbanned');
  }

  onCopied(label: string): void {
    this.toast.set(`${label} copied to clipboard`);
    setTimeout(() => this.toast.set(null), 2000);
  }

  private runBan(call: Observable<AdminUserDetailResponse>, successMsg: string): void {
    this.processingBan.set(true);
    this.error.set(null);
    call.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (resp) => {
        this.processingBan.set(false);
        this.handleDetailUpdate(resp, successMsg);
      },
      error: (err) => {
        this.processingBan.set(false);
        this.handleError(err, 'Action failed. Please try again.');
      },
    });
  }

  private handleDetailUpdate(resp: AdminUserDetailResponse, successMsg: string): void {
    this.saving.set(false);
    this.detail.set(resp);
    this.populateForm(resp.user);
    this.saveSuccess.set(true);
    this.toast.set(successMsg);
    setTimeout(() => {
      this.saveSuccess.set(false);
      this.toast.set(null);
    }, 2500);
  }

  private handleError(err: unknown, fallback: string): void {
    this.saving.set(false);
    const errorBody = (err as { error?: unknown })?.error;
    const banner = applyBackendErrors(this.form, errorBody);
    const hasFieldErrors =
      errorBody && typeof errorBody === 'object' &&
      Array.isArray((errorBody as Record<string, unknown>)['errors']) &&
      ((errorBody as Record<string, unknown>)['errors'] as unknown[]).length > 0;
    this.error.set(banner ?? (hasFieldErrors ? '' : fallback));
  }

  private populateForm(user: AdminUserRecord): void {
    this.form.reset({
      username: user.username,
      avatarUrl: user.avatarUrl ?? '',
      role: user.role === 'OWNER' ? 'OWNER' : user.role,
    });
    this.submitted.set(false);
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.adminUserService.getUser(this.userId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          this.detail.set(resp);
          this.populateForm(resp.user);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message ?? 'Failed to load user.');
          this.loading.set(false);
        },
      });
  }
}
