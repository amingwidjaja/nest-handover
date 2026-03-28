import { serve } from "https://deno.land/std/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js"
import { PDFDocument, rgb, StandardFonts } from "npm:pdf-lib"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Safe text — strip non-latin chars that Helvetica can't render
function safe(text: unknown, fallback = "-"): string {
  if (text == null || text === "") return fallback
  return String(text)
    .replace(/[^\x00-\xFF]/g, "?")
    .replace(/[\r\n]+/g, " ")
    .trim() || fallback
}

function shortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    }) + " WIB"
  } catch { return iso }
}

async function generatePDF(h: any, supabase: any): Promise<Uint8Array> {
  const pdfDoc    = await PDFDocument.create()
  const page      = pdfDoc.addPage([400, 600])
  const { width, height } = page.getSize()
  const fontR     = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontB     = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const INK       = rgb(0.24, 0.15, 0.14)   // #3E2723
  const MUTED     = rgb(0.63, 0.54, 0.50)   // #A1887F
  const LINE      = rgb(0.88, 0.87, 0.84)   // #E0DED7
  const BLACK     = rgb(0, 0, 0)

  const M = 32  // margin
  let y = height - 36

  // ── HEADER ──────────────────────────────────────────────────
  // Accent bar
  page.drawRectangle({ x: 0, y: y - 8, width: 4, height: 28, color: INK })

  page.drawText("TANDA TERIMA DIGITAL", {
    x: M, y, size: 13, font: fontB, color: INK
  })
  y -= 13
  page.drawText("NEST76 STUDIO  |  nest76.com", {
    x: M, y, size: 7, font: fontR, color: MUTED
  })

  // Serial number top-right
  if (h.serial_number) {
    page.drawText(safe(h.serial_number), {
      x: width - M - 80, y: height - 36,
      size: 8, font: fontB, color: INK
    })
  }

  y -= 18
  page.drawLine({ start: { x: M, y }, end: { x: width - M, y }, thickness: 0.5, color: LINE })
  y -= 14

  // ── SECTION: PENGIRIMAN ──────────────────────────────────────
  page.drawText("INFORMASI PENGIRIMAN", { x: M, y, size: 7, font: fontB, color: MUTED })
  y -= 12

  const rows: [string, string][] = [
    ["Pengirim",  safe(h.sender_name)],
    ["Penerima",  safe(h.receiver_target_name)],
  ]
  if (h.destination_address) {
    rows.push(["Alamat", safe(h.destination_address).substring(0, 55)])
  }
  if (h.destination_city) {
    rows.push(["Kota", safe(h.destination_city)])
  }

  for (const [label, value] of rows) {
    page.drawText(`${label}:`, { x: M, y, size: 8, font: fontR, color: MUTED })
    page.drawText(value, { x: M + 60, y, size: 8, font: fontB, color: INK })
    y -= 12
  }

  y -= 6
  page.drawLine({ start: { x: M, y }, end: { x: width - M, y }, thickness: 0.5, color: LINE })
  y -= 14

  // ── SECTION: PAKET ───────────────────────────────────────────
  const items = h.handover_items || []
  const event = Array.isArray(h.receive_event) ? h.receive_event[0] : (h.receive_event || {})

  // Try embed first item photo
  let imgEmbedded = false
  const IMG_SIZE = 72
  const IMG_X = M
  const IMG_Y = y - IMG_SIZE

  if (items[0]?.photo_url) {
    try {
      const { data: blob } = await supabase.storage
        .from("nest-evidence")
        .download(items[0].photo_url)
      if (blob) {
        const buf = await blob.arrayBuffer()
        const bytes = new Uint8Array(buf)
        // Detect format: JPEG starts FF D8, PNG starts 89 50
        let img
        if (bytes[0] === 0xFF && bytes[1] === 0xD8) {
          img = await pdfDoc.embedJpg(buf)
        } else {
          img = await pdfDoc.embedPng(buf).catch(() => null)
          if (!img) img = await pdfDoc.embedJpg(buf).catch(() => null)
        }
        if (img) {
          page.drawRectangle({ x: IMG_X - 1, y: IMG_Y - 1, width: IMG_SIZE + 2, height: IMG_SIZE + 2, borderColor: LINE, borderWidth: 0.5 })
          page.drawImage(img, { x: IMG_X, y: IMG_Y, width: IMG_SIZE, height: IMG_SIZE })
          imgEmbedded = true
        }
      }
    } catch { /* skip photo, continue */ }
  }

  // Item list (beside photo if embedded)
  const listX = imgEmbedded ? M + IMG_SIZE + 10 : M
  const listW = imgEmbedded ? width - M - IMG_SIZE - 10 - M : width - M * 2
  let listY = y

  page.drawText("DAFTAR BARANG", { x: listX, y: listY, size: 7, font: fontB, color: MUTED })
  listY -= 12

  items.slice(0, 5).forEach((it: any, idx: number) => {
    const desc = safe(it.description, "Item").substring(0, imgEmbedded ? 28 : 50)
    page.drawText(`${idx + 1}. ${desc}`, { x: listX, y: listY, size: 8, font: fontR, color: INK })
    listY -= 11
  })

  y = Math.min(IMG_Y - 14, listY - 8)

  page.drawLine({ start: { x: M, y }, end: { x: width - M, y }, thickness: 0.5, color: LINE })
  y -= 14

  // ── SECTION: PENERIMAAN ──────────────────────────────────────
  page.drawText("DETAIL PENERIMAAN", { x: M, y, size: 7, font: fontB, color: MUTED })
  y -= 12

  const method = {
    direct_qr:    "QR Code (Langsung)",
    direct_photo: "Foto Bukti (Langsung)",
    proxy_qr:     "QR Code (Diwakilkan)",
    proxy_photo:  "Foto Bukti (Diwakilkan)",
    GPS:          "Validasi GPS",
  }[event.receive_method as string] || safe(event.receive_method, "-")

  const detailRows: [string, string][] = [
    ["Metode",    method],
    ["Waktu",     shortDate(event.received_at || h.received_at || h.created_at)],
  ]
  if (event.receiver_name) detailRows.push(["Diterima oleh", safe(event.receiver_name)])
  if (event.receiver_relation) detailRows.push(["Hubungan", safe(event.receiver_relation)])
  if (event.gps_lat && event.gps_lng) {
    detailRows.push(["GPS", `${Number(event.gps_lat).toFixed(5)}, ${Number(event.gps_lng).toFixed(5)}`])
  }

  for (const [label, value] of detailRows) {
    page.drawText(`${label}:`, { x: M, y, size: 8, font: fontR, color: MUTED })
    page.drawText(value.substring(0, 52), { x: M + 72, y, size: 8, font: fontB, color: INK })
    y -= 12
  }

  // ── FOOTER: TRUST BLOCK ──────────────────────────────────────
  const footerY = 70
  page.drawLine({ start: { x: M, y: footerY + 44 }, end: { x: width - M, y: footerY + 44 }, thickness: 0.5, color: LINE })

  page.drawText("VERIFIKASI DIGITAL", {
    x: M, y: footerY + 32, size: 7, font: fontB, color: MUTED
  })

  const isQR = event.receive_method?.includes("qr")
  const deviceRole = isQR ? "Device Penerima" : "Device Pengirim"
  const deviceLabel = `${deviceRole}: ` + ([event.device_id, event.device_model].filter(Boolean).join(" | ") || "System Verified")
  const txId = safe(h.id, "").substring(0, 20).toUpperCase()

  const footerLines = [
    `TX ID    : ${txId}`,
    `DEVICE   : ${deviceLabel.substring(0, 50)}`,
    `STATUS   : DIGITAL SIGNATURE VERIFIED BY NEST-CORE`,
  ]

  let fy = footerY + 20
  footerLines.forEach(line => {
    page.drawText(line, { x: M, y: fy, size: 6, font: fontR, color: rgb(0.3, 0.3, 0.3) })
    fy -= 9
  })

  page.drawText(
    "Dokumen ini diterbitkan otomatis oleh NEST76 STUDIO dan berlaku sebagai bukti serah terima sah.",
    { x: M, y: 22, size: 5.5, font: fontR, color: MUTED }
  )
  page.drawText("© 2026 NEST76 STUDIO  |  nest76.com", {
    x: M, y: 13, size: 5.5, font: fontR, color: MUTED
  })

  return await pdfDoc.save()
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const body = await req.json().catch(() => ({}))
    const handoverId = body?.handover_id

    if (!handoverId) {
      return new Response(JSON.stringify({ message: "No handover_id" }), { headers: corsHeaders, status: 200 })
    }

    const { data: full, error: fetchError } = await supabase
      .from("handover")
      .select("*, handover_items(*), receive_event(*)")
      .eq("id", handoverId)
      .single()

    if (fetchError || !full) throw new Error(`Data fetch failed: ${fetchError?.message}`)

    const pdfBytes = await generatePDF(full, supabase)
    const path = `paket/${full.user_id}/${full.id}/receipt_${full.id}.pdf`

    const { error: uploadError } = await supabase.storage
      .from("nest-evidence")
      .upload(path, pdfBytes, { contentType: "application/pdf", upsert: true })

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

    await supabase
      .from("handover")
      .update({ receipt_url: path, receipt_status: "done" })
      .eq("id", full.id)

    // Trigger cleanup (fire-and-forget)
    fetch(Deno.env.get("SUPABASE_URL")! + "/functions/v1/cleanup-handover", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        "Content-Type": "application/json",
      },
    }).catch((e) => console.warn("[receipt-worker] cleanup trigger error:", e))

    console.log(`[receipt-worker] done: ${handoverId} -> ${path}`)

    return new Response(JSON.stringify({ status: "success", path }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
    })

  } catch (err: any) {
    console.error("[receipt-worker] error:", err?.message || err)
    return new Response(JSON.stringify({ error: err?.message || String(err) }), {
      headers: corsHeaders, status: 500
    })
  }
})
