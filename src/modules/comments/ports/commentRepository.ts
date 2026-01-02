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

export interface CommentRepository {
  createComparisonComment(data: CreateComparisonCommentData): Promise<void>;
  findLatestByContext(params: {
    userId: number;
    clientId: number;
    serviceId: number;
    year: number;
    month: number;
  }): Promise<ComparisonCommentSummary | null>;
  disconnect?: () => Promise<void>;
}
