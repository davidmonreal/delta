import { prisma } from "@/lib/db";

import type { LinkedServiceRepository } from "../ports/linkedServiceRepository";

export class PrismaLinkedServiceRepository implements LinkedServiceRepository {
  async listServices() {
    const services = await prisma.service.findMany({
      select: { id: true, conceptRaw: true },
      orderBy: { conceptRaw: "asc" },
    });
    return services.map((service) => ({
      id: service.id,
      label: service.conceptRaw,
    }));
  }

  async listLinks() {
    return prisma.serviceLink.findMany({
      select: {
        id: true,
        serviceId: true,
        linkedServiceId: true,
        offsetMonths: true,
      },
      orderBy: [{ offsetMonths: "asc" }, { serviceId: "asc" }],
    });
  }

  async findLink(params: {
    serviceId: number;
    linkedServiceId: number;
    offsetMonths: number;
  }) {
    return prisma.serviceLink.findFirst({
      where: params,
      select: {
        id: true,
        serviceId: true,
        linkedServiceId: true,
        offsetMonths: true,
      },
    });
  }

  async createLink(params: {
    serviceId: number;
    linkedServiceId: number;
    offsetMonths: number;
  }) {
    return prisma.serviceLink.create({
      data: params,
      select: {
        id: true,
        serviceId: true,
        linkedServiceId: true,
        offsetMonths: true,
      },
    });
  }

  async deleteLink(id: number) {
    await prisma.serviceLink.delete({ where: { id } });
  }

  async disconnect() {
    await prisma.$disconnect();
  }
}
