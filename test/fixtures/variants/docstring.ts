/**
 * Gets the name.
 * @returns The value
 */
export function v1(): string { return ""; }

/**
 * V2: typeless JSDoc, which TypeScript writes.
 * @param format The format
 */
export function v2(format: string): void { void format; }

/**
 * V3: typed JSDoc.
 * @param {string} region The region
 */
export function v3(region: string): void { void region; }

/**
 * Exports the data.
 * @returns The result
 */
export function v4(): string { return ""; }
