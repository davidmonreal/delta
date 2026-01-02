import type { CommentRepository } from "../ports/commentRepository";
import type { CreateComparisonCommentInput } from "../dto/commentSchemas";
import type { CurrentUser } from "@/modules/users/application/types";

export async function createComparisonComment({
  input,
  sessionUser,
  repo,
}: {
  input: CreateComparisonCommentInput;
  sessionUser: CurrentUser;
  repo: CommentRepository;
}) {
  const userId = Number.parseInt(sessionUser.id, 10);
  if (Number.isNaN(userId)) {
    return { error: "Usuari invalid." };
  }

  await repo.createComparisonComment({
    userId,
    clientId: input.clientId,
    serviceId: input.serviceId,
    year: input.year,
    month: input.month,
    kind: input.kind,
    message: input.message,
  });

  return { success: "Comentari registrat." };
}
