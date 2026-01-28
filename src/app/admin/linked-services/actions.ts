"use server";

import { revalidatePath } from "next/cache";

import { requireAdminSession } from "@/lib/require-auth";
import { PrismaLinkedServiceRepository } from "@/modules/linkedServices/infrastructure/prismaLinkedServiceRepository";
import {
  ServiceLinkInputSchema,
  DeleteServiceLinkSchema,
} from "@/modules/linkedServices/dto/linkedServiceSchemas";
import { createServiceLink } from "@/modules/linkedServices/application/createServiceLink";
import { deleteServiceLink } from "@/modules/linkedServices/application/deleteServiceLink";

type ActionState = {
  error?: string;
  success?: string;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createServiceLinkAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdminSession();
  const parsed = ServiceLinkInputSchema.safeParse({
    serviceId: getString(formData, "serviceId"),
    linkedServiceId: getString(formData, "linkedServiceId"),
    offsetMonths: getString(formData, "offsetMonths"),
  });
  if (!parsed.success) {
    return { error: "Dades invàlides." };
  }

  const repo = new PrismaLinkedServiceRepository();
  const result = await createServiceLink({ repo, input: parsed.data });
  await repo.disconnect?.();
  if (result.success) {
    revalidatePath("/admin/linked-services");
  }
  return result;
}

export async function deleteServiceLinkAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdminSession();
  const parsed = DeleteServiceLinkSchema.safeParse({
    id: getString(formData, "id"),
  });
  if (!parsed.success) {
    return { error: "Dades invàlides." };
  }

  const repo = new PrismaLinkedServiceRepository();
  const result = await deleteServiceLink({ repo, id: parsed.data.id });
  await repo.disconnect?.();
  if (result.success) {
    revalidatePath("/admin/linked-services");
  }
  return result;
}
