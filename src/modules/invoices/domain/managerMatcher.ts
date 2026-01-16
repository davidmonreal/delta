import { matchUserId } from "@/lib/match-user";

export type ManagerCandidate = {
  id: number;
  nameNormalized: string;
};

export type ManagerMatchResult = {
  userId: number | null;
  matchedBy: "exact" | "fuzzy" | "none";
};

export type ManagerMatcher = {
  match: (managerName: string, candidates: ManagerCandidate[]) => ManagerMatchResult;
};

export const defaultManagerMatcher: ManagerMatcher = {
  match: (managerName, candidates) => matchUserId(managerName, candidates),
};
