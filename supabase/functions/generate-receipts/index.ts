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
        sender_name,
        receiver_target_name,
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

    const data = rows[0]

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

    // 🔥 generate PDF
    const element = ReceiptDocument({ data })
    const pdfBuffer = await renderToBuffer(element)

    const fileName = `${data.id}.pdf`

    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(fileName, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true
      })

    if (uploadError) {
      return new Response(JSON.stringify({ error: uploadError.message }), { status: 500 })
    }

    const { data: publicUrlData } = supabase.storage
      .from("receipts")
      .getPublicUrl(fileName)

    const publicUrl = publicUrlData?.publicUrl

    if (!publicUrl) {
      return new Response(JSON.stringify({ error: "no public url" }), { status: 500 })
    }

    // ✅ update done
    await supabase
      .from("handover")
      .update({
        receipt_url: publicUrl,
        receipt_status: "done",
        receipt_generated_at: new Date().toISOString()
      })
      .eq("id", data.id)

    return new Response(JSON.stringify({
      success: true,
      id: data.id,
      receipt_url: publicUrl
    }), { status: 200 })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})