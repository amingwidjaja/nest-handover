import React from "react"
import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
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

    const { data, error } = await supabase
      .from("handover")
      .select(`
        id,
        status,
        sender_name,
        receiver_target_name,
        receipt_url,
        handover_items (*),
        receive_event (*)
      `)
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

    if (data.receipt_url) {
      return NextResponse.json({
        success: true,
        skipped: true,
        receipt_url: data.receipt_url
      })
    }

    // 🔥 CORE FIX (INI YANG PENTING)
    const element = (<ReceiptDocument data={data} />) as any

    const pdfBuffer = await renderToBuffer(element)

    const fileName = `${data.id}.pdf`

    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(fileName, pdfBuffer, {
        contentType: "application/pdf",
        upsert: false
      })

    if (uploadError) {
      return NextResponse.json(
        { success: false, error: uploadError.message },
        { status: 500 }
      )
    }

    const { data: publicUrlData } = supabase.storage
      .from("receipts")
      .getPublicUrl(fileName)

    const publicUrl = publicUrlData?.publicUrl

    if (!publicUrl) {
      return NextResponse.json(
        { success: false, error: "gagal mendapatkan URL receipt" },
        { status: 500 }
      )
    }

    await supabase
      .from("handover")
      .update({
        receipt_url: publicUrl,
        receipt_generated_at: new Date().toISOString()
      })
      .eq("id", data.id)

    return NextResponse.json({
      success: true,
      receipt_url: publicUrl
    })

  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}