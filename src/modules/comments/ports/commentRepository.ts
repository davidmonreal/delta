import type { CommentViewer } from "../domain/commentVisibilityPolicy";

export type CommentContextKey = {
  clientId: number;
  serviceId: number;
  year: number;
  month: number;
};

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

export interface CommentQueryRepository {
  findLatestByContext(params: {
    viewer: CommentViewer;
    clientId: number;
    serviceId: number;
    year: number;
    month: number;
  }): Promise<ComparisonCommentSummary | null>;
  findCommentedContexts(params: {
    viewer: CommentViewer;
    months: Array<{ year: number; month: number }>;
    clientIds: number[];
    serviceIds: number[];
  }): Promise<CommentContextKey[]>;
}

export interface CommentCommandRepository {
  createComparisonComment(data: CreateComparisonCommentData): Promise<void>;
}

export interface CommentRepository
  extends CommentQueryRepository,
    CommentCommandRepository {
  disconnect?: () => Promise<void>;
}
