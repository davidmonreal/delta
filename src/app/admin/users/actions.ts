"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-auth";

type ActionState = {
  error?: string;
  success?: string;
};

function normalizeEmail(value: FormDataEntryValue | null) {
  if (!value) return "";
  return String(value).trim().toLowerCase();
}

function normalizeRole(value: FormDataEntryValue | null) {
  const role = String(value ?? "").toUpperCase();
  if (role === "SUPERADMIN" || role === "ADMIN" || role === "USER") {
    return role;
  }
  return null;
}

export async function createUserAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireAdminSession();
  const email = normalizeEmail(formData.get("email"));
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = normalizeRole(formData.get("role"));

  if (!email || !password || !role) {
    return { error: "Falten camps obligatoris." };
  }

  if (session.user.role !== "SUPERADMIN" && role === "SUPERADMIN") {
    return { error: "No tens permisos per crear superadmins." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Aquest email ja existeix." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      email,
      name: name.length ? name : null,
      role,
      passwordHash,
    },
  });

  revalidatePath("/admin/users");
  return { success: "Usuari creat correctament." };
}
