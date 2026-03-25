/**
 * Server-side WhatsApp (Meta Cloud API) utilities for NEST76 STUDIO.
 * Do not import this module from client components.
 */

const GRAPH_VERSION = "v22.0"

export type SendNestNotificationResult = {
  ok: boolean
  error?: string
}

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

/**
 * Sends a branded NEST76 STUDIO handoff notification via WhatsApp template.
 * Requires a Meta-approved template whose body matches:
 * "Halo, Anda menerima paket dari {{1}} via NEST76 STUDIO. Lihat bukti: {{2}}"
 * Configure WA_TEMPLATE_NAME and WA_TEMPLATE_LANG in the environment.
 */
export async function sendNest76StudioHandoff(params: {
  to: string
  organizationName: string
  proofLink: string
}): Promise<SendNestNotificationResult> {
  const token = process.env.WA_TOKEN
  const phoneNumberId = process.env.WA_PHONE_NUMBER_ID
  const templateName =
    process.env.WA_TEMPLATE_NAME?.trim() || "nest76_studio_handoff"
  const templateLang = process.env.WA_TEMPLATE_LANG?.trim() || "id"

  if (!token || !phoneNumberId) {
    return {
      ok: false,
      error: "WA_TOKEN or WA_PHONE_NUMBER_ID not configured"
    }
  }

  const normalized = normalizeIndonesianPhoneTo628(params.to)
  if (!normalized) {
    return { ok: false, error: "Invalid phone number" }
  }

  const org =
    params.organizationName.trim() || "Studio"
  const link = params.proofLink.trim()
  const bodyText = `Halo, Anda menerima paket dari ${org} via NEST76 STUDIO. Lihat bukti: ${link}`

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`

  const templatePayload = {
    messaging_product: "whatsapp" as const,
    to: normalized,
    type: "template" as const,
    template: {
      name: templateName,
      language: { code: templateLang },
      components: [
        {
          type: "body" as const,
          parameters: [
            { type: "text" as const, text: org },
            { type: "text" as const, text: link }
          ]
        }
      ]
    }
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(templatePayload)
    })

    const raw = await res.text()
    if (res.ok) {
      return { ok: true }
    }

    // Fallback: some deployments only have hello_world approved during rollout.
    if (raw.includes("template") || res.status === 400 || res.status === 404) {
      console.warn(
        "[NEST76 STUDIO] WA template failed; retrying hello_world. Details:",
        raw
      )
      const fallback = {
        messaging_product: "whatsapp" as const,
        to: normalized,
        type: "template" as const,
        template: {
          name: "hello_world",
          language: { code: "en_US" }
        }
      }
      const res2 = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(fallback)
      })
      const raw2 = await res2.text()
      if (!res2.ok) {
        return { ok: false, error: raw2 || raw }
      }
      console.warn(
        "[NEST76 STUDIO] WA sent hello_world fallback; branded copy not delivered:",
        bodyText
      )
      return { ok: true }
    }

    return {
      ok: false,
      error: raw || `HTTP ${res.status}`
    }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "network_error"
    }
  }
}

/** @deprecated Use sendNest76StudioHandoff */
export async function sendNESTNotification(
  to: string,
  userName: string,
  packageName: string,
  link: string
): Promise<SendNestNotificationResult> {
  return sendNest76StudioHandoff({
    to,
    organizationName: userName || packageName || "NEST76 STUDIO",
    proofLink: link
  })
}
