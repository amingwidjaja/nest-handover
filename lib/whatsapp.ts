/**
 * Server-side WhatsApp (Meta Cloud API) utilities for NEST76 STUDIO.
 * Do not import this module from client components.
 *
 * Active template: nest76_studio_handoff (Indonesian)
 * Body: "Halo, Anda menerima paket dari {{1}}.
 *        Lihat bukti pengiriman: {{2}}
 *        Bukti ini dibuat menggunakan NEST76 PAKET, product of NEST76 STUDIO."
 * {{1}} = sender name / organization name
 * {{2}} = proof link URL
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
 * Core send function — maps to nest76_studio_handoff template.
 *
 * Template params:
 *   {{1}} senderLabel  — pengirim / nama UMKM
 *   {{2}} proofLink    — URL bukti pengiriman
 */
export async function sendNest76StudioHandoff(params: {
  to: string
  senderLabel: string
  proofLink: string
}): Promise<SendNestNotificationResult> {
  const token = process.env.WA_TOKEN
  const phoneNumberId = process.env.WA_PHONE_NUMBER_ID
  const templateName =
    process.env.WA_TEMPLATE_NAME?.trim() || "nest76_studio_handoff"
  const templateLang = process.env.WA_TEMPLATE_LANG?.trim() || "id"

  if (!token || !phoneNumberId) {
    return { ok: false, error: "WA_TOKEN or WA_PHONE_NUMBER_ID not configured" }
  }

  const normalized = normalizeIndonesianPhoneTo628(params.to)
  if (!normalized) {
    return { ok: false, error: `Invalid phone number: ${params.to}` }
  }

  const sender = params.senderLabel.trim() || "NEST76 STUDIO"
  const link = params.proofLink.trim()
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`

  const payload = {
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
            { type: "text" as const, text: sender },
            { type: "text" as const, text: link },
          ],
        },
      ],
    },
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const raw = await res.text()
    console.log(
      "[WA]",
      res.status,
      raw.length > 400 ? `${raw.slice(0, 400)}…` : raw
    )

    if (res.ok) return { ok: true }

    // Fallback to hello_world if template not yet approved
    if (raw.includes("template") || res.status === 400 || res.status === 404) {
      console.warn("[WA] Template failed — falling back to hello_world")
      const fallback = {
        messaging_product: "whatsapp" as const,
        to: normalized,
        type: "template" as const,
        template: { name: "hello_world", language: { code: "en_US" } },
      }
      const res2 = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fallback),
      })
      if (!res2.ok) {
        const raw2 = await res2.text()
        return { ok: false, error: raw2 || raw }
      }
      return { ok: true }
    }

    return { ok: false, error: raw || `HTTP ${res.status}` }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network_error" }
  }
}

/**
 * Notify penerima target saat handover terjadi (status → received).
 * Link ke public receipt page.
 */
export async function notifyReceiver(params: {
  to: string
  senderLabel: string
  shareToken: string
  baseUrl: string
}): Promise<SendNestNotificationResult> {
  const proofLink = `${params.baseUrl}/receipt/${params.shareToken}`
  return sendNest76StudioHandoff({
    to: params.to,
    senderLabel: params.senderLabel,
    proofLink,
  })
}

/**
 * Notify pengirim asli saat handover terjadi — hanya jika is_sender_proxy = true.
 * Memberitahu bahwa paket sudah diterima atas namanya.
 */
export async function notifySenderProxy(params: {
  to: string
  senderLabel: string
  receiverName: string
  shareToken: string
  baseUrl: string
}): Promise<SendNestNotificationResult> {
  const proofLink = `${params.baseUrl}/receipt/${params.shareToken}`
  return sendNest76StudioHandoff({
    to: params.to,
    senderLabel: `${params.senderLabel} (diterima oleh ${params.receiverName})`,
    proofLink,
  })
}

/** @deprecated Use sendNest76StudioHandoff directly */
export async function sendNESTNotification(
  to: string,
  userName: string,
  packageName: string,
  link: string
): Promise<SendNestNotificationResult> {
  return sendNest76StudioHandoff({
    to,
    senderLabel: userName || packageName || "NEST76 STUDIO",
    proofLink: link,
  })
}
