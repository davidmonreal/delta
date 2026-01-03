import type { UserRepository } from "../ports/userRepository";
import { canEditTarget } from "../domain/policies";
import type { ActionResult, CurrentUser } from "./types";

export async function deleteUser({
  userId,
  sessionUser,
  repo,
}: {
  userId: number;
  sessionUser: CurrentUser;
  repo: UserRepository;
}): Promise<ActionResult> {
  const target = await repo.findById(userId);
  if (!target) {
    return { error: "Usuari no trobat." };
  }

  if (String(target.id) === sessionUser.id) {
    return { error: "No pots esborrar-te a tu mateix." };
  }

  if (sessionUser.role === "USER") {
    return { error: "No tens permisos per esborrar usuaris." };
  }

  if (!canEditTarget(sessionUser.role, target.role)) {
    return { error: "No tens permisos per esborrar superadmins." };
  }

  try {
    await repo.delete(target.id);
  } catch {
    return { error: "No s'ha pogut esborrar l'usuari." };
  }

  return { success: "Usuari esborrat correctament." };
}
