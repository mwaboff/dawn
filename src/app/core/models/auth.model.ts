export interface UserResponse {
  id: number;
  username: string;
  email: string;
  avatarUrl?: string;
  timezone?: string;
  role: string;
  createdAt: string;
  lastModifiedAt: string;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  timezone?: string;
  avatarUrl?: string;
}
