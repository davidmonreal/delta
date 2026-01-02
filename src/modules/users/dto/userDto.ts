import type { UserEntity } from "../domain/user";
import type { UserRole } from "../domain/userRole";

export type UserRowDto = {
  id: number;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: string;
};

export function toUserRowDto(user: UserEntity): UserRowDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}
