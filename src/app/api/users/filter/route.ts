import { NextResponse } from "next/server";

import { requireSession } from "@/lib/require-auth";
import { PrismaUserRepository } from "@/modules/users/infrastructure/prismaUserRepository";
import { listUsersForFilter } from "@/modules/users/application/listUsersForFilter";

export async function GET() {
  const session = await requireSession();
  const repo = new PrismaUserRepository();
  const users = await listUsersForFilter({
    sessionUser: session.user,
    repo,
  });
  await repo.disconnect?.();

  return NextResponse.json({ users });
}
