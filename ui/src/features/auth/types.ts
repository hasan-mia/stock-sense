export type Role = "staff" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthLoginResponse {
  token: string;
  user: User;
}

export interface AuthRegisterResponse {
  token: string;
  user: User;
}
