export type CreateComparisonCommentData = {
  userId: number;
  clientId: number;
  serviceId: number;
  year: number;
  month: number;
  kind: "REPORT_ERROR" | "VALIDATE_DIFFERENCE";
  message: string;
};

export interface CommentRepository {
  createComparisonComment(data: CreateComparisonCommentData): Promise<void>;
  disconnect?: () => Promise<void>;
}
