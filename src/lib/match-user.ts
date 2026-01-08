import { normalizeName } from "./normalize";

type UserCandidate = {
  id: number;
  nameNormalized: string;
};

type MatchResult = {
  userId: number | null;
  matchedBy: "exact" | "fuzzy" | "none";
};

function levenshtein(a: string, b: string) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j += 1) {
    dp[j] = j;
  }

  for (let i = 1; i <= m; i += 1) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j += 1) {
      const temp = dp[j];
      if (a[i - 1] === b[j - 1]) {
        dp[j] = prev;
      } else {
        dp[j] = Math.min(prev + 1, dp[j] + 1, dp[j - 1] + 1);
      }
      prev = temp;
    }
  }

  return dp[n];
}

function similarity(a: string, b: string) {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const distance = levenshtein(a, b);
  return 1 - distance / maxLen;
}

export function matchUserId(
  manager: string,
  userCandidates: UserCandidate[],
): MatchResult {
  const normalized = normalizeName(manager);
  const exact = userCandidates.find((user) => user.nameNormalized === normalized);
  if (exact) {
    return { userId: exact.id, matchedBy: "exact" };
  }

  let best: { id: number; score: number } | null = null;
  let secondBest: { score: number } | null = null;

  for (const user of userCandidates) {
    const score = similarity(normalized, user.nameNormalized);
    if (!best || score > best.score) {
      secondBest = best ? { score: best.score } : null;
      best = { id: user.id, score };
    } else if (!secondBest || score > secondBest.score) {
      secondBest = { score };
    }
  }

  if (!best) {
    return { userId: null, matchedBy: "none" };
  }

  const bestUser = userCandidates.find((user) => user.id === best.id);
  const distance = bestUser
    ? levenshtein(normalized, bestUser.nameNormalized)
    : Number.POSITIVE_INFINITY;
  const minScore = 0.9;
  const maxDistance = 2;
  const isDistinct = !secondBest || best.score - secondBest.score >= 0.02;
  if (best.score >= minScore && distance <= maxDistance && isDistinct) {
    return { userId: best.id, matchedBy: "fuzzy" };
  }

  return { userId: null, matchedBy: "none" };
}
