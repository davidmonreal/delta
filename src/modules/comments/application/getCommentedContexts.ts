import type { CommentQueryRepository } from "../ports/commentRepository";
import type { CurrentUser } from "@/modules/users/application/types";

export async function getCommentedContexts({
  repo,
  sessionUser,
  months,
  clientIds,
  serviceIds,
}: {
  repo: CommentQueryRepository;
  sessionUser: CurrentUser;
  months: Array<{ year: number; month: number }>;
  clientIds: number[];
  serviceIds: number[];
}) {
  const userId = Number.parseInt(sessionUser.id, 10);
  if (Number.isNaN(userId)) {
    return { keys: [], error: "Usuari invàlid." };
  }

  const keys = await repo.findCommentedContexts({
    viewer: { userId, role: sessionUser.role },
    months,
    clientIds,
    serviceIds,
  });

  return { keys };
}
