/**
 * One quoted CSV cell. Values starting with = + - @ tab or CR get a leading '
 * so spreadsheet apps show them as text instead of running them as formulas.
 */
export function csvCell(v: string) {
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return `"${safe.replace(/"/g, '""')}"`;
}
