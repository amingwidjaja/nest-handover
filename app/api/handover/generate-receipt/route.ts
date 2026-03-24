import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import {
  NEST_EVIDENCE_BUCKET,
  buildPaketReceiptPdfPath,
  resolveNestEvidencePublicUrl
} from "@/lib/nest-evidence-upload"
import { renderToBuffer } from "@react-pdf/renderer"
import ReceiptDocument from "@/lib/pdf/ReceiptPDF"

export async function POST(req: Request) {
  try {
    const { handover_id } = await req.json()

    if (!handover_id) {
      return NextResponse.json(
        { success: false, error: "handover_id wajib" },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()

    const { data, error } = await admin
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
      .eq("id", handover_id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: "handover tidak ditemukan" },
        { status: 404 }
      )
    }

    if (data.status !== "accepted") {
      return NextResponse.json(
        { success: false, error: "handover belum accepted" },
        { status: 400 }
      )
    }

    if (!data.user_id) {
      return NextResponse.json(
        { success: false, error: "handover tanpa user_id" },
        { status: 500 }
      )
    }

    if (data.receipt_url) {
      await admin
        .from("handover")
        .update({ receipt_status: "done" })
        .eq("id", data.id)

      const publicUrl = resolveNestEvidencePublicUrl(data.receipt_url)
      return NextResponse.json({
        success: true,
        skipped: true,
        receipt_storage_path: data.receipt_url,
        receipt_public_url: publicUrl
      })
    }

    await admin
      .from("handover")
      .update({ receipt_status: "processing" })
      .eq("id", data.id)

    const { data: profile } = await admin
      .from("profiles")
      .select("company_name, company_logo_url")
      .eq("id", data.user_id)
      .maybeSingle()

    const element = ReceiptDocument({
      data: { ...data, profiles: profile ?? null }
    })
    const pdfBuffer = await renderToBuffer(element)

    const storagePath = buildPaketReceiptPdfPath(data.user_id, data.id)

    const { error: uploadError } = await admin.storage
      .from(NEST_EVIDENCE_BUCKET)
      .upload(storagePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true
      })

    if (uploadError) {
      await admin
        .from("handover")
        .update({ receipt_status: "pending" })
        .eq("id", data.id)

      return NextResponse.json(
        { success: false, error: uploadError.message },
        { status: 500 }
      )
    }

    const publicUrl = resolveNestEvidencePublicUrl(storagePath)
    if (!publicUrl) {
      await admin
        .from("handover")
        .update({ receipt_status: "pending" })
        .eq("id", data.id)

      return NextResponse.json(
        { success: false, error: "gagal membangun URL publik receipt" },
        { status: 500 }
      )
    }

    await admin
      .from("handover")
      .update({
        receipt_url: storagePath,
        receipt_status: "done",
        receipt_generated_at: new Date().toISOString()
      })
      .eq("id", data.id)

    return NextResponse.json({
      success: true,
      receipt_storage_path: storagePath,
      receipt_public_url: publicUrl
    })
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "error" },
      { status: 500 }
    )
  }
}
