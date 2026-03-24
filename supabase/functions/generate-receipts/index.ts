import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { renderToBuffer } from "npm:@react-pdf/renderer"
import ReceiptDocument from "../../../lib/pdf/ReceiptPDF.tsx"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

Deno.serve(async () => {
  try {

    // 🔥 ambil 1 row processing
    const { data: rows, error } = await supabase
      .from("handover")
      .select(`
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
      `)
      .eq("receipt_status", "processing")
      .limit(1)

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }

    if (!rows || rows.length === 0) {
      return new Response(JSON.stringify({ success: true, empty: true }), { status: 200 })
    }

    const data = rows[0] as {
      id: string
      user_id: string
      receipt_url: string | null
      [key: string]: unknown
    }

    if (!data.user_id) {
      return new Response(JSON.stringify({ error: "handover tanpa user_id" }), {
        status: 500
      })
    }

    // ✅ guard: kalau sudah ada URL → skip
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

    // 🔥 generate PDF
    const element = ReceiptDocument({
      data: { ...data, profiles: profile ?? null }
    })
    const pdfBuffer = await renderToBuffer(element)

    const bucket = Deno.env.get("SUPABASE_STORAGE_BUCKET") ?? "nest-evidence"
    const storagePath = `paket/${data.user_id}/${data.id}/receipt_${data.id}.pdf`

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true
      })

    if (uploadError) {
      return new Response(JSON.stringify({ error: uploadError.message }), { status: 500 })
    }

    // ✅ update done — DB stores relative path only
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

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})