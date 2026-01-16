import { test as base, expect, type Page } from "@playwright/test";

import { PrismaClient } from "../../src/generated/prisma";
import { BcryptPasswordHasher } from "../../src/modules/users/infrastructure/bcryptPasswordHasher";
import { normalizeName } from "../../src/lib/normalize";

const test = base;
const shouldRun = process.env.RUN_E2E === "1";

const prisma = new PrismaClient();
const runId = Date.now();
const sourceFile = `__e2e__${runId}`;

const adminEmail = `admin-${runId}@example.com`;
const adminPassword = `pass-${runId}`;
const clientName = `000 E2E Client ${runId}`;
const unmatchedManagerName = `Unmatched Manager ${runId}`;
const extraUserEmails = [
  `user-a-${runId}@example.com`,
  `user-b-${runId}@example.com`,
];
let clientId = 0;
const serviceIds: number[] = [];
const serviceNames = {
  negative: `Service Negative ${runId}`,
  equal: `Service Equal ${runId}`,
  positive: `Service Positive ${runId}`,
  missing: `Service Missing ${runId}`,
  unmatched: `Service Unmatched ${runId}`,
} as const;
const serviceIdsByKey: Record<keyof typeof serviceNames, number> = {
  negative: 0,
  equal: 0,
  positive: 0,
  missing: 0,
  unmatched: 0,
};

async function seedData() {
  const passwordHasher = new BcryptPasswordHasher();
  const adminPasswordHash = await passwordHasher.hash(adminPassword);

  const user = await prisma.user.create({
    data: {
      email: adminEmail,
      name: "Admin User",
      nameNormalized: normalizeName("Admin User"),
      role: "ADMIN",
      passwordHash: adminPasswordHash,
    },
  });

  await prisma.user.create({
    data: {
      email: extraUserEmails[0],
      name: `User A ${runId}`,
      nameNormalized: normalizeName(`User A ${runId}`),
      role: "USER",
      passwordHash: "hashed",
    },
  });

  await prisma.user.create({
    data: {
      email: extraUserEmails[1],
      name: `User B ${runId}`,
      nameNormalized: normalizeName(`User B ${runId}`),
      role: "USER",
      passwordHash: "hashed",
    },
  });

  const client = await prisma.client.create({
    data: {
      nameRaw: clientName,
      nameNormalized: normalizeName(clientName),
    },
  });

  clientId = client.id;
  for (const [key, name] of Object.entries(serviceNames) as [
    keyof typeof serviceNames,
    string,
  ][]) {
    const service = await prisma.service.create({
      data: {
        conceptRaw: name,
        conceptNormalized: normalizeName(name),
      },
    });
    serviceIdsByKey[key] = service.id;
    serviceIds.push(service.id);
  }

  await prisma.invoiceLine.createMany({
    data: [
      {
        date: new Date(),
        year: 2024,
        month: 1,
        units: 10,
        price: 10,
        total: 100,
        manager: "Manager X",
        managerNormalized: "MANAGER X",
        sourceFile,
        clientId: client.id,
        serviceId: serviceIdsByKey.negative,
        managerUserId: user.id,
      },
      {
        date: new Date(),
        year: 2025,
        month: 1,
        units: 10,
        price: 8,
        total: 80,
        manager: "Manager X",
        managerNormalized: "MANAGER X",
        sourceFile,
        clientId: client.id,
        serviceId: serviceIdsByKey.negative,
        managerUserId: user.id,
      },
      {
        date: new Date(),
        year: 2025,
        month: 1,
        units: 5,
        price: 8,
        total: 40,
        manager: unmatchedManagerName,
        managerNormalized: normalizeName(unmatchedManagerName),
        sourceFile,
        clientId: client.id,
        serviceId: serviceIdsByKey.unmatched,
      },
      {
        date: new Date(),
        year: 2024,
        month: 1,
        units: 10,
        price: 10,
        total: 100,
        manager: "Manager X",
        managerNormalized: "MANAGER X",
        sourceFile,
        clientId: client.id,
        serviceId: serviceIdsByKey.equal,
        managerUserId: user.id,
      },
      {
        date: new Date(),
        year: 2025,
        month: 1,
        units: 10,
        price: 10,
        total: 100,
        manager: "Manager X",
        managerNormalized: "MANAGER X",
        sourceFile,
        clientId: client.id,
        serviceId: serviceIdsByKey.equal,
        managerUserId: user.id,
      },
      {
        date: new Date(),
        year: 2024,
        month: 1,
        units: 10,
        price: 10,
        total: 100,
        manager: "Manager X",
        managerNormalized: "MANAGER X",
        sourceFile,
        clientId: client.id,
        serviceId: serviceIdsByKey.positive,
        managerUserId: user.id,
      },
      {
        date: new Date(),
        year: 2025,
        month: 1,
        units: 10,
        price: 12,
        total: 120,
        manager: "Manager X",
        managerNormalized: "MANAGER X",
        sourceFile,
        clientId: client.id,
        serviceId: serviceIdsByKey.positive,
        managerUserId: user.id,
      },
      {
        date: new Date(),
        year: 2024,
        month: 1,
        units: 10,
        price: 9,
        total: 90,
        manager: "Manager X",
        managerNormalized: "MANAGER X",
        sourceFile,
        clientId: client.id,
        serviceId: serviceIdsByKey.missing,
        managerUserId: user.id,
      },
    ],
  });

  return user.id;
}

async function cleanup() {
  await prisma.invoiceLine.deleteMany({ where: { sourceFile } });
  await prisma.user.deleteMany({
    where: { email: { in: [adminEmail, ...extraUserEmails] } },
  });
  await prisma.client.deleteMany({ where: { id: clientId } });
  await prisma.service.deleteMany({ where: { id: { in: serviceIds } } });
  await prisma.$disconnect();
}

async function login(page: Page) {
  await page.goto("/");
  if (page.url().includes("/login")) {
    await page.getByLabel("Email").fill(adminEmail);
    await page.getByLabel("Password").fill(adminPassword);
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.waitForURL((url) => !url.pathname.startsWith("/login"));
  }
}

test.describe("admin flows", () => {
  test.skip(!shouldRun, "Set RUN_E2E=1 to run admin e2e tests.");

  test.beforeAll(async () => {
    await seedData();
  });

  test.afterAll(async () => {
    await cleanup();
  });

  test("can access admin users page", async ({ page }) => {
    await login(page);
    await page.goto("/admin/users");
    await expect(
      page.getByRole("heading", { name: "Gestio d'usuaris" }),
    ).toBeVisible();
  });

  test("can impersonate a user and return", async ({ page }) => {
    await login(page);
    await page.goto(`/admin/users?q=${runId}`);

    const userRow = page
      .getByText(extraUserEmails[0], { exact: true })
      .locator("..");
    await userRow.locator('button[title="Suplantar usuari"]').click();

    await expect(page.getByText(`Suplantant User A ${runId}`)).toBeVisible();
    const stopButton = page.getByRole("button", { name: "Deixar de suplantar" });
    await expect(stopButton).toBeVisible();

    await stopButton.click();
    await expect(page.getByText(`Suplantant User A ${runId}`)).toHaveCount(0);

    await page.goto("/admin/users");
    await expect(
      page.getByRole("heading", { name: "Gestio d'usuaris" }),
    ).toBeVisible();
  });

  test("shows unmatched managers", async ({ page }) => {
    await login(page);
    await page.goto("/admin/upload");
    await expect(page.getByRole("heading", { name: "Upload" })).toBeVisible();
    await expect(page.getByText(unmatchedManagerName)).toBeVisible();
  });

  test("shows client comparison filters", async ({ page }) => {
    await login(page);
    await page.goto(`/client/${clientId}?show=neg`);
    await expect(page.getByText(clientName)).toBeVisible();
    const comparisonSection = page.locator("section").first();
    await expect(
      comparisonSection.getByText(serviceNames.negative, { exact: true }).first(),
    ).toBeVisible();
    await expect(
      comparisonSection.getByText(serviceNames.equal, { exact: true }),
    ).toHaveCount(0);
    await expect(
      comparisonSection.getByText(serviceNames.positive, { exact: true }),
    ).toHaveCount(0);
    await expect(
      comparisonSection.getByText(serviceNames.missing, { exact: true }),
    ).toHaveCount(0);

    await page.goto(`/client/${clientId}?show=eq`);
    const comparisonSectionEq = page.locator("section").first();
    await expect(
      comparisonSectionEq.getByText(serviceNames.equal, { exact: true }).first(),
    ).toBeVisible();
    await expect(
      comparisonSectionEq.getByText(serviceNames.negative, { exact: true }),
    ).toHaveCount(0);
    await expect(
      comparisonSectionEq.getByText(serviceNames.positive, { exact: true }),
    ).toHaveCount(0);
    await expect(
      comparisonSectionEq.getByText(serviceNames.missing, { exact: true }),
    ).toHaveCount(0);

    await page.goto(`/client/${clientId}?show=pos`);
    const comparisonSectionPos = page.locator("section").first();
    await expect(
      comparisonSectionPos
        .getByText(serviceNames.positive, { exact: true })
        .first(),
    ).toBeVisible();
    await expect(
      comparisonSectionPos.getByText(serviceNames.negative, { exact: true }),
    ).toHaveCount(0);
    await expect(
      comparisonSectionPos.getByText(serviceNames.equal, { exact: true }),
    ).toHaveCount(0);
    await expect(
      comparisonSectionPos.getByText(serviceNames.missing, { exact: true }),
    ).toHaveCount(0);

    await page.goto(`/client/${clientId}?show=miss`);
    const comparisonSectionMiss = page.locator("section").first();
    await expect(
      comparisonSectionMiss
        .getByText(serviceNames.missing, { exact: true })
        .first(),
    ).toBeVisible();
    await expect(
      comparisonSectionMiss.getByText(serviceNames.negative, { exact: true }),
    ).toHaveCount(0);
    await expect(
      comparisonSectionMiss.getByText(serviceNames.equal, { exact: true }),
    ).toHaveCount(0);
    await expect(
      comparisonSectionMiss.getByText(serviceNames.positive, { exact: true }),
    ).toHaveCount(0);
  });

  test("shows monthly comparison on the home page", async ({ page }) => {
    await login(page);
    await page.goto(`/?show=neg&year=2025&month=1`);
    await expect(page.getByPlaceholder("Cerca per client")).toBeVisible();
    await page.getByPlaceholder("Cerca per client").fill(clientName);
    await expect(page.getByText(clientName)).toBeVisible();
    await expect(page.getByText(serviceNames.negative).first()).toBeVisible();
    await expect(page.getByText(serviceNames.equal, { exact: true })).toHaveCount(0);
    await expect(page.getByText(serviceNames.positive, { exact: true })).toHaveCount(0);
    await expect(page.getByText(serviceNames.missing, { exact: true })).toHaveCount(0);
  });

  test("keeps edit modal open when switching users after save", async ({
    page,
  }) => {
    await login(page);
    await page.goto(`/admin/users?q=${runId}`);

    const editButtons = page.locator('button[title="Editar usuari"]');
    const editButtonCount = await editButtons.count();
    expect(editButtonCount).toBeGreaterThan(1);

    const adminRow = page.getByText(adminEmail, { exact: true }).locator("..");
    await adminRow.locator('button[title="Editar usuari"]').click();
    const editHeading = page.getByRole("heading", { name: "Editar usuari" });
    await expect(editHeading).toBeVisible();

    await page.getByLabel("Nom").fill(`Admin User ${runId} Updated`);
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(editHeading).toBeHidden();

    const secondaryRow = page
      .getByText(extraUserEmails[0], { exact: true })
      .locator("..");
    await secondaryRow.locator('button[title="Editar usuari"]').click();
    await expect(editHeading).toBeVisible();
    await page.waitForTimeout(300);
    await expect(editHeading).toBeVisible();
  });
});
