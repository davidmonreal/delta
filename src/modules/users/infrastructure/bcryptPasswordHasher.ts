import bcrypt from "bcryptjs";

import type { PasswordHasher } from "../ports/passwordHasher";

export class BcryptPasswordHasher implements PasswordHasher {
  async hash(password: string) {
    return bcrypt.hash(password, 12);
  }
}
