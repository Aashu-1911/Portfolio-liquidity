export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: AuthUser;
}

export interface MeResponse {
  user: AuthUser;
}
