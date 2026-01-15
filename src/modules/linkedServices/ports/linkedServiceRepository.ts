export type LinkedServiceLink = {
  id: number;
  serviceId: number;
  linkedServiceId: number;
  offsetMonths: number;
};

export type LinkedServiceSummary = {
  id: number;
  label: string;
};

export interface LinkedServiceRepository {
  listServices(): Promise<LinkedServiceSummary[]>;
  listLinks(): Promise<LinkedServiceLink[]>;
  findLink(params: {
    serviceId: number;
    linkedServiceId: number;
    offsetMonths: number;
  }): Promise<LinkedServiceLink | null>;
  createLink(params: {
    serviceId: number;
    linkedServiceId: number;
    offsetMonths: number;
  }): Promise<LinkedServiceLink>;
  deleteLink(id: number): Promise<void>;
  disconnect?: () => Promise<void>;
}
