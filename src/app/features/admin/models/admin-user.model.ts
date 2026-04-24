export type UserRole = 'USER' | 'MODERATOR' | 'ADMIN' | 'OWNER';

export const EDITABLE_ROLES: UserRole[] = ['USER', 'MODERATOR', 'ADMIN'];

export interface AdminUserSummary {
  id: number;
  username: string;
  avatarUrl?: string | null;
  role: UserRole;
  banned?: boolean;
  bannedAt?: string | null;
  banReason?: string | null;
  createdAt: string;
  lastSeenAt?: string | null;
}

export function isBanned(user: Pick<AdminUserSummary, 'banned' | 'bannedAt'>): boolean {
  return user.banned === true || user.bannedAt != null;
}

export interface AdminUserListResponse {
  content: AdminUserSummary[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface AdminUserRecord extends AdminUserSummary {
  email?: string | null;
  timezone?: string | null;
  lastModifiedAt?: string | null;
  usernameChosen?: boolean;
  deletedAt?: string | null;
}

export interface AdminUserIdentity {
  provider: string;
  displayName?: string | null;
  linkedAt: string;
  lastUsedAt?: string | null;
}

export interface AdminLoginEvent {
  id: number;
  provider: string;
  ipAddress: string | null;
  deviceInfo: string | null;
  createdAt: string;
}

export interface AdminUsernameEntry {
  previousUsername: string;
  newUsername: string;
  changedByUserId: number;
  changedByUsername: string;
  changedAt: string;
}

export interface AdminActionEntry {
  id: number;
  actorUserId: number | null;
  actorUsername: string | null;
  action: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface AdminUserDetailResponse {
  user: AdminUserRecord;
  identities: AdminUserIdentity[];
  loginEvents?: AdminLoginEvent[];
  usernameHistory?: AdminUsernameEntry[];
  adminActions?: AdminActionEntry[];
}

export interface AdminUserPatchRequest {
  username?: string;
  avatarUrl?: string;
  role?: UserRole;
}

export interface AdminUserListParams {
  page: number;
  size: number;
  sort?: string;
  ascending?: boolean;
  isBanned?: boolean;
  role?: UserRole;
  username?: string;
  email?: string;
}
