export function sampleProfile(path: number[], spacing: number): number[] {
  return path.filter((_, i) => i % spacing === 0);
}

export function tempDir(prefix: string): string {
  return `/tmp/${prefix}`;
}

export function testService(): string {
  return 'service';
}
