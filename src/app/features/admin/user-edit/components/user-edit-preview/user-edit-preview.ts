import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { UserRole } from '../../../models/admin-user.model';

export interface UserPreviewData {
  username: string;
  avatarUrl: string | null;
  role: UserRole;
  banned: boolean;
  banReason?: string | null;
  email?: string | null;
  lastSeenAt?: string | null;
}

@Component({
  selector: 'app-user-edit-preview',
  templateUrl: './user-edit-preview.html',
  styleUrl: './user-edit-preview.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserEditPreview {
  readonly data = input.required<UserPreviewData>();

  initial(): string {
    return (this.data().username?.[0] ?? '?').toUpperCase();
  }
}
