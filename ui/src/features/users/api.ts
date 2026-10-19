import { apiClient } from "@/lib/api-client";
import type { CreateUserInput, UpdateUserInput, User } from "./types";

export type { User, CreateUserInput, UpdateUserInput };

export interface UserPage {
  data: User[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export async function listUsers(page = 1, limit = 20): Promise<UserPage> {
  const res = await apiClient.get("/users", {
    params: { limit, page },
  });
  return {
    data: res.data.data as User[],
    meta: res.data.meta,
  };
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const res = await apiClient.post("/users", input);
  return res.data.data as User;
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
): Promise<User> {
  const res = await apiClient.patch(`/users/${id}`, input);
  return res.data.data as User;
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/users/${id}`);
}
