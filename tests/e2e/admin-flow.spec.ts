import { test as base, expect, type Page } from "@playwright/test";

import { PrismaClient } from "../../src/generated/prisma";
import { normalizeName } from "../../src/lib/normalize";

const test = base;
const shouldRun = process.env.RUN_E2E === "1";

const prisma = new PrismaClient();
const runId = Date.now();
const sourceFile = `__e2e__${runId}`;

const adminEmail = `admin-${runId}@example.com`;
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
  const user = await prisma.user.create({
    data: {
      email: adminEmail,
      name: "Admin User",
      nameNormalized: normalizeName("Admin User"),
      role: "ADMIN",
      passwordHash: "hashed",
    },
  });

  const client = await prisma.client.create({
    data: {
      nameRaw: `Client ${runId}`,
      nameNormalized: normalizeName(`Client ${runId}`),
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
        manager: "Unmatched Manager",
        managerNormalized: "UNMATCHED MANAGER",
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
  await prisma.user.deleteMany({ where: { email: adminEmail } });
  await prisma.client.deleteMany({ where: { id: clientId } });
  await prisma.service.deleteMany({ where: { id: { in: serviceIds } } });
  await prisma.$disconnect();
}

async function login(page: Page) {
  await page.goto("/");
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

  test("shows unmatched managers", async ({ page }) => {
    await login(page);
    await page.goto("/admin/upload");
    await expect(page.getByRole("heading", { name: "Upload" })).toBeVisible();
    await expect(page.getByText("Unmatched Manager")).toBeVisible();
  });

  test("shows client comparison filters", async ({ page }) => {
    await login(page);
    await page.goto(`/client/${clientId}?show=neg`);
    await expect(page.getByText(`Client ${runId}`)).toBeVisible();
    await expect(page.getByText(serviceNames.negative, { exact: true })).toBeVisible();
    await expect(page.getByText(serviceNames.equal, { exact: true })).toHaveCount(0);
    await expect(page.getByText(serviceNames.positive, { exact: true })).toHaveCount(0);
    await expect(page.getByText(serviceNames.missing, { exact: true })).toHaveCount(0);

    await page.goto(`/client/${clientId}?show=eq`);
    await expect(page.getByText(serviceNames.equal, { exact: true })).toBeVisible();
    await expect(page.getByText(serviceNames.negative, { exact: true })).toHaveCount(0);
    await expect(page.getByText(serviceNames.positive, { exact: true })).toHaveCount(0);
    await expect(page.getByText(serviceNames.missing, { exact: true })).toHaveCount(0);

    await page.goto(`/client/${clientId}?show=pos`);
    await expect(page.getByText(serviceNames.positive, { exact: true })).toBeVisible();
    await expect(page.getByText(serviceNames.negative, { exact: true })).toHaveCount(0);
    await expect(page.getByText(serviceNames.equal, { exact: true })).toHaveCount(0);
    await expect(page.getByText(serviceNames.missing, { exact: true })).toHaveCount(0);

    await page.goto(`/client/${clientId}?show=miss`);
    await expect(page.getByText(serviceNames.missing, { exact: true })).toBeVisible();
    await expect(page.getByText(serviceNames.negative, { exact: true })).toHaveCount(0);
    await expect(page.getByText(serviceNames.equal, { exact: true })).toHaveCount(0);
    await expect(page.getByText(serviceNames.positive, { exact: true })).toHaveCount(0);
  });

  test("shows monthly comparison on the home page", async ({ page }) => {
    await login(page);
    await page.goto(`/?show=neg&year=2025&month=1`);
    await expect(page.getByText(`Client ${runId}`)).toBeVisible();
    await expect(page.getByText(serviceNames.negative)).toBeVisible();
    await expect(page.getByText(serviceNames.equal, { exact: true })).toHaveCount(0);
    await expect(page.getByText(serviceNames.positive, { exact: true })).toHaveCount(0);
    await expect(page.getByText(serviceNames.missing, { exact: true })).toHaveCount(0);
  });
});
