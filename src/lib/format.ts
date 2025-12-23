const currencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

const unitFormatter = new Intl.NumberFormat("es-ES", {
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("es-ES", {
  style: "percent",
  maximumFractionDigits: 1,
});

export function formatCurrency(value: number) {
  if (!Number.isFinite(value)) return "-";
  return currencyFormatter.format(value);
}

export function formatUnits(value: number) {
  if (!Number.isFinite(value)) return "-";
  return unitFormatter.format(value);
}

export function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "-";
  return percentFormatter.format(value / 100);
}
