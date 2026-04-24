import { Component, ChangeDetectionStrategy, input, output, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import {
  AdminUserRecord,
  AdminUserIdentity,
  UserRole,
  EDITABLE_ROLES,
  isBanned,
} from '../../../models/admin-user.model';

@Component({
  selector: 'app-user-edit-identity-panel',
  templateUrl: './user-edit-identity-panel.html',
  styleUrl: './user-edit-identity-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
})
export class UserEditIdentityPanel {
  private readonly platformId = inject(PLATFORM_ID);

  readonly form = input.required<FormGroup>();
  readonly user = input.required<AdminUserRecord>();
  readonly identities = input.required<AdminUserIdentity[]>();
  readonly submitted = input(false);

  readonly copied = output<string>();

  readonly editableRoles = EDITABLE_ROLES;
  readonly isUserBanned = isBanned;

  roleOptions(): UserRole[] {
    const current = this.user().role;
    if (current === 'OWNER') return ['OWNER', ...EDITABLE_ROLES];
    return EDITABLE_ROLES;
  }

  isOwnerLocked(): boolean {
    return this.user().role === 'OWNER';
  }

  hasError(field: string, code: string): boolean {
    const ctrl = this.form().get(field);
    if (!ctrl) return false;
    return ctrl.hasError(code) && (ctrl.touched || this.submitted());
  }

  backendError(field: string): string | null {
    const err = this.form().get(field)?.errors?.['backend'];
    return typeof err === 'string' ? err : null;
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
  }

  onCopy(value: string | number | null | undefined, label: string): void {
    if (value === null || value === undefined || value === '') return;
    if (!isPlatformBrowser(this.platformId)) return;
    navigator.clipboard?.writeText(String(value)).then(() => this.copied.emit(label)).catch(() => undefined);
  }
}
