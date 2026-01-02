export function formatRef(
  series: string | null,
  albaran: string | null,
  numero: string | null,
) {
  const seriesPart = series || albaran || "";
  const numberPart = numero || albaran || "";
  if (seriesPart && numberPart && seriesPart !== numberPart) {
    return `${seriesPart}-${numberPart}`;
  }
  return seriesPart || numberPart || null;
}
