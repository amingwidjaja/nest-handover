/** Indonesian mobile: leading 0 → 62; keep digits only. */
export function sanitizeWhatsappDigits(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (!digits) return ""
  if (digits.startsWith("0")) return `62${digits.slice(1)}`
  return digits
}
