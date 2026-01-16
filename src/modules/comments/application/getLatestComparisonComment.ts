import type { CommentQueryRepository } from "../ports/commentRepository";
import type { CurrentUser } from "@/modules/users/application/types";

export async function getLatestComparisonComment({
  repo,
  sessionUser,
  clientId,
  serviceId,
  year,
  month,
}: {
  repo: CommentQueryRepository;
  sessionUser: CurrentUser;
  clientId: number;
  serviceId: number;
  year: number;
  month: number;
}) {
  const userId = Number.parseInt(sessionUser.id, 10);
  if (Number.isNaN(userId)) {
    return { error: "Usuari invàlid." };
  }

  const comment = await repo.findLatestByContext({
    viewer: { userId, role: sessionUser.role },
    clientId,
    serviceId,
    year,
    month,
  });

  return { comment };
}
