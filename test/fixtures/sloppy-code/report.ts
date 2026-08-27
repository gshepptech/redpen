// A second file in the same fixture, for the tells that need a whole file to
// show: a barrel needs five forwards, a weak type needs a habit rather than a
// boundary.

export function buildReport(
  title: string,
  rows: string,
  format: string,
  locale: string,
  timezone: string,
  currency: string,
  footer: string,
) {
  return { title, rows, format, locale, timezone, currency, footer };
}

export function render(input: any) {
  const parsed = input as any;
  const rows: any = parsed.rows;
  return rows;
}

export function chunk(items: string[], size: number) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export function groupBy(items: string[], key: string) {
  return items.reduce((acc, item) => acc, {});
}

export function retry(attempts: number) {
  if (attempts > 3) { // max retries
    return false;
  }
  setTimeout(() => {}, 86400000); // one day
  return true;
}
