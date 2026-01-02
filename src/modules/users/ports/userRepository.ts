import type { UserEntity } from "../domain/user";
import type { UserRole } from "../domain/userRole";

export type CreateUserData = {
  email: string;
  name: string | null;
  role: UserRole;
  passwordHash: string;
};

export type UpdateUserData = {
  email: string;
  name: string | null;
  role: UserRole;
  passwordHash?: string;
};

export type ListUsersParams = {
  roles: UserRole[];
  query?: string;
};

export interface UserRepository {
  findByEmail(email: string): Promise<UserEntity | null>;
  findById(id: number): Promise<UserEntity | null>;
  create(data: CreateUserData): Promise<UserEntity>;
  update(id: number, data: UpdateUserData): Promise<UserEntity>;
  list(params: ListUsersParams): Promise<UserEntity[]>;
}
