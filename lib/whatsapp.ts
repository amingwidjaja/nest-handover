/**
 * Server-side WhatsApp (Meta Cloud API) utilities.
 * Do not import this module from client components.
 */

const GRAPH_VERSION = "v22.0"

/**
 * Normalizes Indonesian mobile input to digits-only international form: 628xxxxxxxxxx.
 * Accepts 08..., +62..., 62..., 8... (without leading 0).
 */
export function normalizeIndonesianPhoneTo628(input: string): string | null {
  const trimmed = String(input ?? "").trim()
  if (!trimmed) return null

  let digits = trimmed.replace(/\D/g, "")
  if (!digits) return null

  if (digits.startsWith("62")) {
    return digits.length >= 11 ? digits : null
  }

  if (digits.startsWith("0")) {
    digits = "62" + digits.slice(1)
    return digits.length >= 11 ? digits : null
  }

  if (digits.startsWith("8")) {
    digits = "62" + digits
    return digits.length >= 11 ? digits : null
  }

  return null
}

export type SendNestNotificationResult = {
  ok: boolean
  error?: string
}

/**
 * Sends a WhatsApp template message via Meta Graph API.
 * Uses the pre-approved `hello_world` template (en_US). Context fields are reserved for future NEST templates.
 */
export async function sendNESTNotification(
  to: string,
  userName: string,
  packageName: string,
  link: string
): Promise<SendNestNotificationResult> {
  const token = process.env.WA_TOKEN
  const phoneNumberId = process.env.WA_PHONE_NUMBER_ID

  if (!token || !phoneNumberId) {
    return {
      ok: false,
      error: "WA_TOKEN or WA_PHONE_NUMBER_ID not configured"
    }
  }

  const normalized = normalizeIndonesianPhoneTo628(to)
  if (!normalized) {
    return { ok: false, error: "Invalid phone number" }
  }

  // Reserved for a future NEST-specific template (body parameters).
  const _ctx = { userName, packageName, link }
  if (process.env.NODE_ENV === "development") {
    console.debug("[whatsapp] template context", _ctx)
  }

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`

  const body = {
    messaging_product: "whatsapp" as const,
    to: normalized,
    type: "template" as const,
    template: {
      name: "hello_world",
      language: {
        code: "en_US"
      }
    }
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    })

    const raw = await res.text()
    if (!res.ok) {
      return {
        ok: false,
        error: raw || `HTTP ${res.status}`
      }
    }

    return { ok: true }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "network_error"
    }
  }
}
