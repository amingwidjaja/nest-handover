import { NextResponse } from "next/server"
import puppeteer from "puppeteer"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const { handover_id } = await req.json()

    if (!handover_id) {
      return NextResponse.json(
        { success: false, error: "handover_id wajib" },
        { status: 400 }
      )
    }

    // 1. ambil data langsung dari DB
    const { data, error } = await supabase
      .from("handover")
      .select(`
        id,
        share_token,
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

    // 2. hanya generate kalau accepted
    if (data.status !== "accepted") {
      return NextResponse.json(
        { success: false, error: "handover belum accepted" },
        { status: 400 }
      )
    }

    // 3. idempotent
    if (data.receipt_url) {
      return NextResponse.json({
        success: true,
        skipped: true,
        receipt_url: data.receipt_url
      })
    }

    const event = data.receive_event?.[0]

    // 4. build HTML
    const itemsHtml = (data.handover_items || [])
      .map((i: any) => `<li>${i.description ?? "-"}</li>`)
      .join("")

    const html = `
      <html>
      <body style="font-family: sans-serif; padding:40px">

        <h1>NEST Paket</h1>
        <h2>Bukti Serah Terima</h2>

        <p><b>Pengirim:</b> ${data.sender_name || "-"}</p>
        <p><b>Penerima:</b> ${data.receiver_target_name || "-"}</p>

        <hr/>

        <h3>Isi Paket</h3>
        <ul>${itemsHtml}</ul>

        <hr/>

        <p><b>Diterima oleh:</b> ${event?.receiver_name || data.receiver_target_name || "-"}</p>
        <p><b>Metode:</b> ${event?.receive_method || "-"}</p>
        <p><b>Waktu:</b> ${event?.created_at || "-"}</p>

      </body>
      </html>
    `

    // 5. generate PDF
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    })

    const page = await browser.newPage()
    await page.setContent(html)

    const pdfBuffer = await page.pdf({
      format: "A4"
    })

    await browser.close()

    // 6. upload ke storage
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

    // 7. ambil public URL
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

    // 8. update DB
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