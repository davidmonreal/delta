const currencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

const unitFormatter = new Intl.NumberFormat("es-ES", {
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(value || 0);
}

export function formatUnits(value: number) {
  return unitFormatter.format(value || 0);
}
