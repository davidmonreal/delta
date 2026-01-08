import { normalizeName } from "./normalize";

type UserCandidate = {
  id: number;
  nameNormalized: string;
};

type MatchResult = {
  userId: number | null;
  matchedBy: "exact" | "none";
};

export function matchUserId(
  manager: string,
  userCandidates: UserCandidate[],
): MatchResult {
  const normalized = normalizeName(manager);
  const exact = userCandidates.find((user) => user.nameNormalized === normalized);
  if (exact) {
    return { userId: exact.id, matchedBy: "exact" };
  }

  return { userId: null, matchedBy: "none" };
}
