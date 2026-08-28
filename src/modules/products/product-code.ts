export const PRODUCT_CODE_PREFIXES = {
  phone: "TEL",
  laptop: "LAP",
  part: "PAR",
} as const;

export type ProductCodeCategory = keyof typeof PRODUCT_CODE_PREFIXES;

export function formatProductCode(
  category: ProductCodeCategory,
  sequence: number,
): string {
  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new RangeError("Product code sequence must be a positive integer.");
  }

  const prefix = PRODUCT_CODE_PREFIXES[category];
  return `${prefix}-${String(sequence).padStart(3, "0")}`;
}
