import { normalizeName } from "@/lib/normalize";
import type { UserEntity } from "../domain/user";

export type UserCandidate = {
  id: number;
  nameNormalized: string;
};

/**
 * Build normalized user candidates for manager matching.
 * We prefer stored normalized names (stable), and only normalize display names
 * when needed to keep fuzzy matching consistent with ingestion rules.
 */
export function buildUserCandidates(users: UserEntity[]): UserCandidate[] {
  return users.reduce<UserCandidate[]>((acc, user) => {
    const normalized =
      user.nameNormalized ?? (user.name ? normalizeName(user.name) : null);
    if (normalized) {
      acc.push({ id: user.id, nameNormalized: normalized });
    }
    return acc;
  }, []);
}
