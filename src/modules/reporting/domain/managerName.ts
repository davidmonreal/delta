export function resolveManagerName(
  managerName?: string | null,
  userName?: string | null,
) {
  const rawName = userName ?? managerName ?? "";
  const trimmed = rawName.trim();
  return trimmed.length ? trimmed : null;
}
