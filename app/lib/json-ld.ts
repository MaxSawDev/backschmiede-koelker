/**
 * Serializes JSON for an inline script without allowing data to terminate the
 * script element. This is required even for application/ld+json because HTML
 * parsing happens before the script type is considered.
 */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
