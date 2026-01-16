import { normalizeName } from "@/lib/normalize";

import type { ManagerCandidate, ManagerMatcher } from "../domain/managerMatcher";
import { defaultManagerMatcher } from "../domain/managerMatcher";
import type {
  BackfillProgress,
  InvoiceRepository,
  ManagerAssignmentUpdate,
  ManagerNormalizationUpdate,
} from "../ports/invoiceRepository";

export async function backfillManagers({
  repo,
  userCandidates,
  onProgress,
  matcher = defaultManagerMatcher,
}: {
  repo: InvoiceRepository;
  userCandidates: ManagerCandidate[];
  onProgress?: (progress: BackfillProgress) => Promise<void> | void;
  matcher?: ManagerMatcher;
}) {
  const lines = await repo.listBackfillLines();
  const progressBatch = 100;
  if (onProgress) {
    await onProgress({ processed: 0, total: lines.length });
  }

  let updated = 0;
  let processed = 0;
  const matchCache = new Map<string, number | null>();
  const updateBatchSize = 200;
  for (let start = 0; start < lines.length; start += updateBatchSize) {
    const batch = lines.slice(start, start + updateBatchSize);
    const assignmentsByKey = new Map<string, ManagerAssignmentUpdate>();
    const normalizeOnlyByValue = new Map<string, number[]>();

    for (const line of batch) {
      const normalized = normalizeName(line.managerNormalized ?? line.manager);
      if (line.managerUserId == null) {
        let userId = matchCache.get(normalized);
        if (userId === undefined) {
          const match = matcher.match(normalized, userCandidates);
          userId = match.userId ?? null;
          matchCache.set(normalized, userId);
        }
        if (userId) {
          updated += 1;
        }
        const key = `${normalized}::${userId ?? "null"}`;
        const entry = assignmentsByKey.get(key) ?? {
          ids: [],
          managerUserId: userId,
          managerNormalized: normalized,
        };
        entry.ids.push(line.id);
        assignmentsByKey.set(key, entry);
      } else if (line.managerNormalized !== normalized) {
        const ids = normalizeOnlyByValue.get(normalized) ?? [];
        ids.push(line.id);
        normalizeOnlyByValue.set(normalized, ids);
      }
    }

    const assignmentUpdates = Array.from(assignmentsByKey.values());
    if (assignmentUpdates.length) {
      await repo.updateManagerAssignments({ updates: assignmentUpdates });
    }

    const normalizationUpdates: ManagerNormalizationUpdate[] = Array.from(
      normalizeOnlyByValue,
      ([managerNormalized, ids]) => ({
        ids,
        managerNormalized,
      }),
    );
    if (normalizationUpdates.length) {
      await repo.updateManagerNormalized({ updates: normalizationUpdates });
    }

    processed += batch.length;
    if (onProgress && (processed % progressBatch === 0 || processed === lines.length)) {
      await onProgress({ processed, total: lines.length });
    }
  }

  return updated;
}
