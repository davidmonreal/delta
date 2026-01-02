import type { ClientComparisonResult } from "../application/getClientComparison";
import type { MonthlyComparisonResult } from "../application/getMonthlyComparison";

export type MonthlyComparisonDto = MonthlyComparisonResult;
export type ClientComparisonDto = ClientComparisonResult;

export function toMonthlyComparisonDto(result: MonthlyComparisonResult): MonthlyComparisonDto {
  return result;
}

export function toClientComparisonDto(result: ClientComparisonResult): ClientComparisonDto {
  return result;
}
