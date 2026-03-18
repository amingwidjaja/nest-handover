import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import puppeteer from "puppeteer"

export async function POST(req: Request) {
  try {
    const { handover_id } = await req.json()

    if (!handover_id) {
      return NextResponse.json({ success: false, error: "handover_id wajib" }, { status: 400 })
    }

    // ambil data
    const { data: handover } = await supabase
      .from("handover")
      .select(`
        *,
        handover_items (*),
        receive_event (*)
      `)
      .eq("id", handover_id)
      .single()

    if (!handover || handover.status !== "accepted") {
      return NextResponse.json({ success: false, error: "handover belum accepted" }, { status: 400 })
    }

    // generate PDF via page
    const browser = await puppeteer.launch({ args: ["--no-sandbox"] })
    const page = await browser.newPage()

    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/receipt/${handover.share_token}`

    await page.goto(url, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true
    })

    await browser.close()

    const filePath = `receipts/${handover_id}.pdf`

    // upload ke storage
    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(filePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: false
      })

    if (uploadError) {
      return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 })
    }

    const { data: publicUrl } = supabase.storage
      .from("receipts")
      .getPublicUrl(filePath)

    // save ke DB
    await supabase
      .from("handover")
      .update({
        receipt_url: publicUrl.publicUrl,
        receipt_generated_at: new Date().toISOString()
      })
      .eq("id", handover_id)

    return NextResponse.json({
      success: true,
      url: publicUrl.publicUrl
    })

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}