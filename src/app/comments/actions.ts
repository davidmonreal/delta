"use server";

import { requireSession } from "@/lib/require-auth";
import { CreateComparisonCommentSchema } from "@/modules/comments/dto/commentSchemas";
import { createComparisonComment } from "@/modules/comments/application/createComparisonComment";
import { PrismaCommentRepository } from "@/modules/comments/infrastructure/prismaCommentRepository";

type ActionState = {
  error?: string;
  success?: string;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createComparisonCommentAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireSession();
  const parsed = CreateComparisonCommentSchema.safeParse({
    clientId: getString(formData, "clientId"),
    serviceId: getString(formData, "serviceId"),
    year: getString(formData, "year"),
    month: getString(formData, "month"),
    kind: getString(formData, "kind"),
    message: getString(formData, "message"),
  });

  if (!parsed.success) {
    return { error: "Cal una explicacio valida." };
  }

  const repo = new PrismaCommentRepository();
  const result = await createComparisonComment({
    input: parsed.data,
    sessionUser: { id: session.user.id, role: session.user.role },
    repo,
  });
  await repo.disconnect?.();

  return result;
}
