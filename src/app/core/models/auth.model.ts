import { Role } from '../../shared/models/role.model';

export interface UserResponse {
  id: number;
  username: string;
  role: Role;
  email?: string;
  avatarUrl?: string;
  timezone?: string;
  createdAt: string;
  lastModifiedAt: string;
  usernameChosen: boolean;
}

export interface ChooseUsernameRequest {
  username: string;
}

export interface DevLoginRequest {
  email: string;
  role?: string;
  username?: string;
}
