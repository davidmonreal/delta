import type { CommentRepository } from "../ports/commentRepository";
import type { CurrentUser } from "@/modules/users/application/types";

export async function getLatestComparisonComment({
  repo,
  sessionUser,
  clientId,
  serviceId,
  year,
  month,
}: {
  repo: CommentRepository;
  sessionUser: CurrentUser;
  clientId: number;
  serviceId: number;
  year: number;
  month: number;
}) {
  const userId = Number.parseInt(sessionUser.id, 10);
  if (Number.isNaN(userId)) {
    return { error: "Usuari invalid." };
  }

  const comment = await repo.findLatestByContext({
    userId,
    clientId,
    serviceId,
    year,
    month,
  });

  return { comment };
}
