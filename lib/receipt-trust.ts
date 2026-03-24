/**
 * Shared formatting for receipt PDF + public receipt page (digital trust block).
 */

export function isQrReceiveMethod(method: string | undefined | null): boolean {
  return method === "direct_qr" || method === "proxy_qr"
}

export function parseGps(
  lat: unknown,
  lng: unknown
): { lat: number; lng: number } | null {
  if (lat == null || lng == null) return null
  const a = typeof lat === "string" ? parseFloat(lat) : Number(lat)
  const b = typeof lng === "string" ? parseFloat(lng) : Number(lng)
  if (Number.isNaN(a) || Number.isNaN(b)) return null
  return { lat: a, lng: b }
}

export function formatGpsCoords(lat: unknown, lng: unknown): string {
  const g = parseGps(lat, lng)
  if (!g) return "—"
  return `${g.lat.toFixed(6)}, ${g.lng.toFixed(6)}`
}

/** Display line: `{device_model} ({device_id})` per spec; uses em dash when parts missing. */
export function formatDeviceIdLine(
  deviceModel: string | null | undefined,
  deviceId: string | null | undefined
): string {
  const m = deviceModel?.trim() || "—"
  const id = deviceId?.trim() || "—"
  return `${m} (${id})`
}

/** Long user-agent strings: show head + ellipsis for UI/PDF readability. */
export function shortenDeviceIdForDisplay(
  deviceId: string | null | undefined,
  maxLen = 96
): string {
  if (!deviceId?.trim()) return "—"
  const t = deviceId.trim()
  if (t.length <= maxLen) return t
  return `${t.slice(0, Math.max(0, maxLen - 1))}…`
}

export function formatTrustTimestampId(dateStr: string | undefined | null): string {
  if (!dateStr) return "-"
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return "-"
  return (
    new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta"
    }).format(date) + " WIB"
  )
}

export function getClientDeviceMeta(): { device_id: string; device_model: string } {
  if (typeof navigator === "undefined") {
    return { device_id: "", device_model: "" }
  }
  const ua = navigator.userAgent
  const nav = navigator as Navigator & {
    userAgentData?: { platform?: string; model?: string; brands?: { brand: string }[] }
  }
  const uaData = nav.userAgentData
  let model = ""
  if (uaData?.model) model = uaData.model
  else if (uaData?.platform) model = uaData.platform
  else if (/iPhone/i.test(ua)) model = "iPhone"
  else if (/Android/i.test(ua)) model = "Android"
  else if (/Windows NT/i.test(ua)) model = "Windows"
  else if (/Mac OS X/i.test(ua)) model = "macOS"
  else model = "Web Browser"
  return { device_id: ua, device_model: model }
}
