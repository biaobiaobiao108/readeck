export interface User {
  id: number;
  uid: string;
  created: string;
  updated: string;
  last_login: string;
  username: string;
  email: string;
  group: 'admin' | 'user';
  settings: Record<string, unknown>;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface UserProfile {
  id: number;
  uid: string;
  username: string;
  email: string;
  group: string;
}
