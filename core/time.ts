export function isoNow(): string {
  return new Date().toISOString();
}

export function parseOptionalDate(s: string | undefined | null): Date | undefined {
  if (!s?.trim()) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
}
