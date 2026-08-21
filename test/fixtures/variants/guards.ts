export function v1(rows?: number[]): number {
  if (typeof rows === "undefined") {
    rows = [];
  }
  return rows.length;
}
// just in case the caller forgets
export const v2 = 2;
// should never happen, but belt and braces
export const v3 = 3;
