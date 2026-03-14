import { NextResponse } from "next/server"
import puppeteer from "puppeteer"
import { supabase } from "@/lib/supabase"

export async function GET(req: Request) {

  const { searchParams } = new URL(req.url)
  const token = searchParams.get("token")

  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 })
  }

  const { data } = await supabase
    .from("handover")
    .select(`
      *,
      handover_items (*),
      receive_event (*)
    `)
    .eq("share_token", token)
    .single()

  if (!data) {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }

  const html = `
  <html>
  <body style="font-family: sans-serif;padding:40px">

    <h1>NEST Paket</h1>
    <h2>Bukti Serah Terima</h2>

    <p><b>Penerima:</b> ${data.receiver_target_name}</p>
    <p><b>Pengirim:</b> ${data.sender_name || "-"}</p>

    <hr/>

    <h3>Isi Paket</h3>
    <ul>
      ${data.handover_items.map((i:any) => `<li>${i.description}</li>`).join("")}
    </ul>

    <hr/>

    <p><b>Diterima oleh:</b> ${data.receive_event?.receiver_name || data.receiver_target_name}</p>
    <p><b>Metode:</b> ${data.receive_event?.receive_method}</p>
    <p><b>Waktu:</b> ${data.receive_event?.timestamp}</p>

  </body>
  </html>
  `

  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  await page.setContent(html)

  const pdf = await page.pdf({
    format: "A4"
  })

  await browser.close()

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf"
    }
  })
}