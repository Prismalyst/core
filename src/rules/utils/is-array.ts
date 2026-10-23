export function isArray(arg: unknown): arg is Array<unknown> {
  return Array.isArray(arg) && arg !== null;
}
