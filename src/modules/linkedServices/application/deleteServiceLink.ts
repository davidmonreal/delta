import type { LinkedServiceRepository } from "../ports/linkedServiceRepository";

export type DeleteServiceLinkResult = {
  error?: string;
  success?: string;
};

export async function deleteServiceLink({
  repo,
  id,
}: {
  repo: LinkedServiceRepository;
  id: number;
}): Promise<DeleteServiceLinkResult> {
  if (!Number.isFinite(id) || id <= 0) {
    return { error: "Identificador invàlid." };
  }

  await repo.deleteLink(id);
  return { success: "Vinculació esborrada." };
}
