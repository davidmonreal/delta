import type { UserEntity } from "../../domain/user";
import type { UserRole } from "../../domain/userRole";
import type { CreateUserData, ListUsersParams, UpdateUserData, UserRepository } from "../../ports/userRepository";

export class InMemoryUserRepository implements UserRepository {
  private users: UserEntity[];
  private nextId: number;

  constructor(seed: UserEntity[] = []) {
    this.users = [...seed];
    const maxId = seed.reduce((max, user) => Math.max(max, user.id), 0);
    this.nextId = maxId + 1;
  }

  async findByEmail(email: string) {
    return this.users.find((user) => user.email === email) ?? null;
  }

  async findById(id: number) {
    return this.users.find((user) => user.id === id) ?? null;
  }

  async create(data: CreateUserData) {
    const user: UserEntity = {
      id: this.nextId++,
      createdAt: new Date(),
      ...data,
    };
    this.users.push(user);
    return user;
  }

  async update(id: number, data: UpdateUserData) {
    const index = this.users.findIndex((user) => user.id === id);
    if (index === -1) {
      throw new Error("User not found");
    }
    const existing = this.users[index];
    const updated: UserEntity = {
      ...existing,
      ...data,
      passwordHash: data.passwordHash ?? existing.passwordHash,
    };
    this.users[index] = updated;
    return updated;
  }

  async list({ roles, query }: ListUsersParams) {
    const queryLower = query?.toLowerCase();
    return this.users.filter((user) => {
      if (!roles.includes(user.role as UserRole)) return false;
      if (!queryLower) return true;
      return (
        user.email.toLowerCase().includes(queryLower) ||
        (user.name ?? "").toLowerCase().includes(queryLower)
      );
    });
  }
}

export class StubPasswordHasher {
  async hash(password: string) {
    return `hashed:${password}`;
  }

  async compare(password: string, passwordHash: string) {
    return passwordHash === `hashed:${password}`;
  }
}
