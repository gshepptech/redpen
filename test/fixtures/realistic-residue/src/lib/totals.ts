export function acres(rows: number[]): number {
  // Guard against undefined just in case the caller skips validation.
  if (typeof rows === "undefined") {
    rows = [];
  }
  return rows.reduce((a, b) => a + b, 0);
}
