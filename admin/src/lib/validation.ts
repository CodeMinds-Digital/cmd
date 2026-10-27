/** zod issues → { "field.path": first message } for inline form errors. */
export function fieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const key = i.path.map(String).join('.');
    out[key] ??= i.message;
  }
  return out;
}

export const ROW_ID = /^[a-zA-Z0-9._-]{1,36}$/;
