export type CreateComparisonCommentData = {
  userId: number;
  clientId: number;
  serviceId: number;
  year: number;
  month: number;
  kind: "REPORT_ERROR" | "VALIDATE_DIFFERENCE";
  message: string;
};

export type ComparisonCommentSummary = {
  kind: "REPORT_ERROR" | "VALIDATE_DIFFERENCE";
  message: string;
  createdAt: Date;
};

import type { UserRole } from "@/modules/users/domain/userRole";

export type CommentViewer = {
  userId: number;
  role: UserRole;
};

export type CommentContextKey = {
  clientId: number;
  serviceId: number;
};

export interface CommentRepository {
  createComparisonComment(data: CreateComparisonCommentData): Promise<void>;
  findLatestByContext(params: {
    viewer: CommentViewer;
    clientId: number;
    serviceId: number;
    year: number;
    month: number;
  }): Promise<ComparisonCommentSummary | null>;
  findCommentedContexts(params: {
    viewer: CommentViewer;
    year: number;
    month: number;
    clientIds: number[];
    serviceIds: number[];
  }): Promise<CommentContextKey[]>;
  disconnect?: () => Promise<void>;
}
