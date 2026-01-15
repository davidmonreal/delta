import type { LinkedServiceRepository } from "../ports/linkedServiceRepository";

export type CreateServiceLinkInput = {
  serviceId: number;
  linkedServiceId: number;
  offsetMonths: number;
};

export type CreateServiceLinkResult = {
  error?: string;
  success?: string;
};

function normalizePair(serviceId: number, linkedServiceId: number) {
  if (serviceId <= linkedServiceId) {
    return { serviceId, linkedServiceId };
  }
  return { serviceId: linkedServiceId, linkedServiceId: serviceId };
}

export async function createServiceLink({
  repo,
  input,
}: {
  repo: LinkedServiceRepository;
  input: CreateServiceLinkInput;
}): Promise<CreateServiceLinkResult> {
  if (input.offsetMonths < 0) {
    return { error: "El nombre de mesos ha de ser positiu." };
  }
  if (input.serviceId === input.linkedServiceId && input.offsetMonths === 12) {
    return { error: "La recurrència anual ja s'aplica per defecte." };
  }
  if (input.serviceId === input.linkedServiceId && input.offsetMonths === 0) {
    return { error: "No té sentit vincular un servei amb ell mateix el mateix mes." };
  }

  const normalized = normalizePair(input.serviceId, input.linkedServiceId);
  const existing = await repo.findLink({
    ...normalized,
    offsetMonths: input.offsetMonths,
  });
  if (existing) {
    return { error: "Aquesta vinculació ja existeix." };
  }

  await repo.createLink({
    ...normalized,
    offsetMonths: input.offsetMonths,
  });

  return { success: "Vinculació creada." };
}
