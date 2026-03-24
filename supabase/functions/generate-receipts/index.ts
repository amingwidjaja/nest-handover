/**
 * Sole worker for receipt PDF generation.
 * Claim: status=accepted, receipt_url IS NULL, receipt_status pending|failed|null.
 * Upload: paket/{user_id}/{handover_id}/receipt_{handover_id}.pdf
 *
 * Trigger: schedule HTTP POST to this function URL (e.g. every minute) via
 * Supabase Cron, pg_cron + pg_net, GitHub Actions, or Supabase Scheduled Functions.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { renderToBuffer } from "npm:@react-pdf/renderer"
import ReceiptDocument from "../../../lib/pdf/ReceiptPDF.tsx"
import {
  buildPaketReceiptPdfPath,
  NEST_EVIDENCE_BUCKET
} from "../../../lib/nest-evidence-upload.ts"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

Deno.serve(async () => {
  try {
    const { data: claimedId, error: claimErr } = await supabase.rpc(
      "claim_handover_receipt_job"
    )

    if (claimErr) {
      return new Response(JSON.stringify({ error: claimErr.message }), {
        status: 500
      })
    }

    const handoverId =
      claimedId != null && claimedId !== ""
        ? String(claimedId)
        : null

    if (!handoverId) {
      return new Response(JSON.stringify({ success: true, empty: true }), {
        status: 200
      })
    }

    const { data: row, error: fetchErr } = await supabase
      .from("handover")
      .select(
        `
        id,
        user_id,
        serial_number,
        status,
        sender_name,
        receiver_target_name,
        received_at,
        receipt_url,
        receipt_status,
        handover_items (*),
        receive_event (*)
      `
      )
      .eq("id", handoverId)
      .single()

    if (fetchErr || !row) {
      await supabase
        .from("handover")
        .update({ receipt_status: "failed" })
        .eq("id", handoverId)
      return new Response(
        JSON.stringify({ error: fetchErr?.message || "handover not found" }),
        { status: 500 }
      )
    }

    const data = row as {
      id: string
      user_id: string
      receipt_url: string | null
      [key: string]: unknown
    }

    if (!data.user_id) {
      await supabase
        .from("handover")
        .update({ receipt_status: "failed" })
        .eq("id", data.id)
      return new Response(
        JSON.stringify({ error: "handover tanpa user_id" }),
        { status: 500 }
      )
    }

    if (data.receipt_url) {
      await supabase
        .from("handover")
        .update({
          receipt_status: "done",
          receipt_generated_at: new Date().toISOString()
        })
        .eq("id", data.id)
      return new Response(JSON.stringify({ skipped: true }), { status: 200 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_name, company_logo_url")
      .eq("id", data.user_id)
      .maybeSingle()

    let pdfBuffer: Uint8Array
    try {
      const element = ReceiptDocument({
        data: { ...data, profiles: profile ?? null }
      })
      pdfBuffer = await renderToBuffer(element)
    } catch (renderErr: unknown) {
      const msg = renderErr instanceof Error ? renderErr.message : "render failed"
      await supabase
        .from("handover")
        .update({ receipt_status: "failed" })
        .eq("id", data.id)
      return new Response(JSON.stringify({ error: msg }), { status: 500 })
    }

    const storagePath = buildPaketReceiptPdfPath(data.user_id, data.id)

    const { error: uploadError } = await supabase.storage
      .from(NEST_EVIDENCE_BUCKET)
      .upload(storagePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true
      })

    if (uploadError) {
      await supabase
        .from("handover")
        .update({ receipt_status: "failed" })
        .eq("id", data.id)
      return new Response(JSON.stringify({ error: uploadError.message }), {
        status: 500
      })
    }

    await supabase
      .from("handover")
      .update({
        receipt_url: storagePath,
        receipt_status: "done",
        receipt_generated_at: new Date().toISOString()
      })
      .eq("id", data.id)

    return new Response(
      JSON.stringify({
        success: true,
        id: data.id,
        receipt_storage_path: storagePath
      }),
      { status: 200 }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "error"
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
})
