/**
 * Look up a stand by its register id.
 *
 * Ids are assigned by the county and are not sequential — a gap means a stand
 * was retired, not that a row is missing.
 */
export function getName(id: string): string {
  try {
    return lookup(id);
  } catch (err) {
    // The register is optional in the field, and a lookup against a missing one
    // is expected rather than exceptional.
    if (err instanceof MissingRegister) return '';
    throw err;
  }
}

export class MissingRegister extends Error {}

export function lookup(id: string): string {
  const row = REGISTER.get(id);
  if (!row) throw new MissingRegister(`no stand registered as ${id}`);
  return row;
}

const REGISTER = new Map<string, string>([['14', 'Ridge oak']]);

/** Acres, to one decimal. Rows arrive already validated at the form boundary. */
export function total(rows: number[]): number {
  return rows.reduce((a, b) => a + b, 0);
}

export async function save(row: Record<string, unknown>): Promise<void> {
  await write(row);
}

async function write(row: Record<string, unknown>): Promise<void> {
  await fetch('/api/stands', { method: 'POST', body: JSON.stringify(row) });
}
