/**
 * notify-handover — Central event dispatcher NEST76 STUDIO
 *
 * Dipanggil oleh:
 *   1. Next.js /api/handover/receive — status: received (WA notifications)
 *   2. DB trigger fn_on_handover_accepted via pg_net — status: accepted (PDF chain)
 *   3. pg_cron auto-accept — status: accepted (PDF chain + WA proxy sender)
 *
 * Security: verify x-internal-secret header untuk calls dari DB trigger
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const GRAPH_VERSION = "v22.0"
const INTERNAL_SECRET = Deno.env.get("NEST_INTERNAL_SECRET") || "nest76-internal-2026"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-secret",
}

// ── Auth check ───────────────────────────────────────────────

function isAuthorized(req: Request): boolean {
  // Accept service role key (from Next.js server calls)
  const auth = req.headers.get("authorization") || ""
  const svcKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  if (svcKey && auth === `Bearer ${svcKey}`) return true

  // Accept internal secret (from DB trigger via pg_net with anon key)
  const internalSecret = req.headers.get("x-internal-secret") || ""
  if (internalSecret === INTERNAL_SECRET) return true

  return false
}

// ── WA helpers ───────────────────────────────────────────────

function normalizePhone(input: string): string | null {
  const trimmed = String(input ?? "").trim()
  if (!trimmed) return null
  let digits = trimmed.replace(/\D/g, "")
  if (!digits) return null
  if (digits.startsWith("62")) return digits.length >= 11 ? digits : null
  if (digits.startsWith("0")) { digits = "62" + digits.slice(1); return digits.length >= 11 ? digits : null }
  if (digits.startsWith("8")) { digits = "62" + digits; return digits.length >= 11 ? digits : null }
  return null
}

async function sendWA(params: {
  to: string
  senderLabel: string
  proofLink: string
}): Promise<void> {
  const token = Deno.env.get("WA_TOKEN")
  const phoneNumberId = Deno.env.get("WA_PHONE_NUMBER_ID")
  const templateName = Deno.env.get("WA_TEMPLATE_NAME") || "nest76_studio_handoff"
  const templateLang = Deno.env.get("WA_TEMPLATE_LANG") || "id"

  if (!token || !phoneNumberId) {
    console.warn("[WA] WA_TOKEN or WA_PHONE_NUMBER_ID not set")
    return
  }

  const normalized = normalizePhone(params.to)
  if (!normalized) {
    console.warn("[WA] Invalid phone:", params.to)
    return
  }

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`
  const payload = {
    messaging_product: "whatsapp",
    to: normalized,
    type: "template",
    template: {
      name: templateName,
      language: { code: templateLang },
      components: [{
        type: "body",
        parameters: [
          { type: "text", text: params.senderLabel.trim() || "NEST76 STUDIO" },
          { type: "text", text: params.proofLink.trim() },
        ],
      }],
    },
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const raw = await res.text()
    if (!res.ok) console.warn(`[WA] HTTP ${res.status}:`, raw.slice(0, 300))
    else console.log(`[WA] Sent to ${normalized}`)
  } catch (e) {
    console.warn("[WA] fetch error:", e)
  }
}

// ── Main handler ─────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (!isAuthorized(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: corsHeaders,
    })
  }

  try {
    const { handover_id, new_status } = await req.json()

    if (!handover_id || !new_status) {
      return new Response(
        JSON.stringify({ error: "missing handover_id or new_status" }),
        { status: 400, headers: corsHeaders }
      )
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const appUrl = Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://nest76.com"

    const { data: handover, error: fetchErr } = await supabase
      .from("handover")
      .select(`
        id, share_token, sender_name,
        receiver_whatsapp, receiver_target_name,
        is_sender_proxy, sender_whatsapp, receipt_status,
        profiles:user_id ( company_name )
      `)
      .eq("id", handover_id)
      .single()

    if (fetchErr || !handover) {
      console.error("[notify-handover] fetch error:", fetchErr)
      return new Response(JSON.stringify({ error: "handover not found" }), {
        status: 404, headers: corsHeaders,
      })
    }

    const senderLabel =
      (handover as any).profiles?.company_name?.trim() ||
      handover.sender_name?.trim() ||
      "NEST76 STUDIO"

    const proofLink = `${appUrl}/receipt/${handover.share_token}`

    // ── Route by status ───────────────────────────────────────

    if (new_status === "rejected") {
      const { rejection_reason } = await req.clone().json().catch(() => ({}))
      // WA ke pengirim asli
      const toWa = handover.is_sender_proxy
        ? handover.sender_whatsapp
        : handover.receiver_whatsapp // fallback: user sendiri

      const rejectorName = handover.receiver_target_name?.trim() || "Penerima"
      const reasonText   = rejection_reason?.trim() ? ` Alasan: ${rejection_reason.trim()}` : ""

      if (handover.sender_whatsapp || handover.receiver_whatsapp) {
        const notifTo = handover.sender_whatsapp || handover.receiver_whatsapp
        await sendWA({
          to: notifTo,
          senderLabel: `${senderLabel} (DITOLAK oleh ${rejectorName}.${reasonText})`,
          proofLink,
        })
      }

      return new Response(
        JSON.stringify({ ok: true, handover_id, new_status }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    if (new_status === "received") {
      // WA to receiver target
      if (handover.receiver_whatsapp) {
        await sendWA({ to: handover.receiver_whatsapp, senderLabel, proofLink })
      }

      // WA to original sender if proxy
      if (handover.is_sender_proxy && handover.sender_whatsapp) {
        const { data: evt } = await supabase
          .from("receive_event")
          .select("receiver_name, receiver_type")
          .eq("handover_id", handover_id)
          .order("id", { ascending: false })
          .limit(1)
          .single()

        const receivedByName =
          evt?.receiver_name?.trim() ||
          handover.receiver_target_name?.trim() ||
          "penerima"

        await sendWA({
          to: handover.sender_whatsapp,
          senderLabel: `${senderLabel} (diterima oleh ${receivedByName})`,
          proofLink,
        })
      }
    }

    if (new_status === "accepted") {
      // Trigger receipt-worker for PDF
      if (!handover.receipt_status || handover.receipt_status === "pending") {
        const workerUrl =
          Deno.env.get("SUPABASE_URL")!.replace("/rest/v1", "") +
          "/functions/v1/receipt-worker"

        fetch(workerUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ handover_id }),
        }).catch((e) => console.warn("[notify-handover] receipt-worker error:", e))
      }

      // WA auto-accept notification to original sender if proxy
      if (handover.is_sender_proxy && handover.sender_whatsapp) {
        await sendWA({
          to: handover.sender_whatsapp,
          senderLabel: `${senderLabel} (paket dianggap diterima otomatis)`,
          proofLink,
        })
      }
    }

    return new Response(
      JSON.stringify({ ok: true, handover_id, new_status }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err) {
    console.error("[notify-handover] error:", err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: corsHeaders,
    })
  }
})
