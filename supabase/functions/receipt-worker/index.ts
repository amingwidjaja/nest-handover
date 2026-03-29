import { serve } from "https://deno.land/std/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js"
import { PDFDocument, rgb, StandardFonts } from "npm:pdf-lib"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// A4 dimensions in points (72pt = 1 inch, A4 = 210x297mm)
const A4_W = 595.28
const A4_H = 841.89
const M = 40        // margin
const COL = (A4_W - M * 2) / 2 - 6  // column width (2 col layout)
const FULL = A4_W - M * 2             // full content width

// Colors B/W
const BLACK  = rgb(0, 0, 0)
const INK    = rgb(0.15, 0.15, 0.15)
const MUTED  = rgb(0.45, 0.45, 0.45)
const LIGHT  = rgb(0.75, 0.75, 0.75)
const XLIGHT = rgb(0.92, 0.92, 0.92)

function safe(text: unknown, fallback = "-"): string {
  if (text == null || text === "") return fallback
  return String(text)
    .replace(/[^\x00-\xFF]/g, "?")
    .replace(/[\r\n]+/g, " ")
    .trim() || fallback
}

function safeShort(text: unknown, max = 60, fallback = "-"): string {
  const s = safe(text, fallback)
  return s.length > max ? s.substring(0, max - 1) + "…" : s
}

function shortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    }) + " WIB"
  } catch { return iso }
}

function methodLabel(m: string): string {
  return ({
    direct_qr:    "QR Code — Langsung",
    direct_photo: "Foto Bukti — Langsung",
    proxy_qr:     "QR Code — Diwakilkan",
    proxy_photo:  "Foto Bukti — Diwakilkan",
    GPS:          "Validasi GPS",
  })[m] || safe(m, "-")
}

async function embedPhoto(
  pdfDoc: PDFDocument,
  supabase: ReturnType<typeof createClient>,
  photoUrl: string | null | undefined
): Promise<ReturnType<PDFDocument["embedJpg"]> | null> {
  if (!photoUrl) return null
  try {
    const { data: blob } = await supabase.storage.from("nest-evidence").download(photoUrl)
    if (!blob) return null
    const buf = await blob.arrayBuffer()
    const bytes = new Uint8Array(buf)
    if (bytes[0] === 0xFF && bytes[1] === 0xD8) {
      return await pdfDoc.embedJpg(buf)
    }
    return await pdfDoc.embedPng(buf).catch(() => pdfDoc.embedJpg(buf).catch(() => null))
  } catch { return null }
}

async function generatePDF(h: any, supabase: ReturnType<typeof createClient>): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page   = pdfDoc.addPage([A4_W, A4_H])
  const fontR  = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontB  = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const ev = Array.isArray(h.receive_event) ? h.receive_event[0] : (h.receive_event ?? {})
  const items: any[] = h.handover_items ?? []

  let y = A4_H - M

  // ── HEADER ───────────────────────────────────────────────────────────────
  page.drawText("TANDA TERIMA DIGITAL", {
    x: M, y: y, size: 22, font: fontB, color: BLACK
  })
  page.drawText("NEST76 PAKET  |  nest76.com", {
    x: M, y: y - 16, size: 12, font: fontR, color: MUTED
  })
  if (h.serial_number) {
    const snText = safe(h.serial_number)
    const snW = fontB.widthOfTextAtSize(snText, 14)
    page.drawText(snText, {
      x: A4_W - M - snW, y: y, size: 14, font: fontB, color: INK
    })
  }
  y -= 28
  page.drawLine({ start: { x: M, y }, end: { x: M + FULL, y }, thickness: 1, color: BLACK })
  y -= 20

  // ── PENGIRIM & PENERIMA (2 kolom) ────────────────────────────────────────
  const boxH = 100
  // Pengirim box
  page.drawRectangle({ x: M, y: y - boxH, width: COL, height: boxH, borderColor: LIGHT, borderWidth: 0.5 })
  page.drawText("PENGIRIM", { x: M + 10, y: y - 16, size: 10, font: fontB, color: MUTED })
  page.drawText(safeShort(h.sender_name, 30), { x: M + 10, y: y - 34, size: 16, font: fontB, color: INK })
  if (h.sender_whatsapp) {
    page.drawText(safe(h.sender_whatsapp), { x: M + 10, y: y - 52, size: 12, font: fontR, color: MUTED })
  }

  // Penerima box
  const rx = M + COL + 12
  page.drawRectangle({ x: rx, y: y - boxH, width: COL, height: boxH, borderColor: LIGHT, borderWidth: 0.5 })
  page.drawText("PENERIMA", { x: rx + 10, y: y - 16, size: 10, font: fontB, color: MUTED })
  page.drawText(safeShort(h.receiver_target_name, 30), { x: rx + 10, y: y - 34, size: 16, font: fontB, color: INK })
  if (h.receiver_whatsapp) {
    page.drawText(safe(h.receiver_whatsapp), { x: rx + 10, y: y - 52, size: 12, font: fontR, color: MUTED })
  }

  // Alamat (kalau ada) — di bawah nama penerima
  const addrParts = [h.destination_address, h.destination_district, h.destination_city, h.destination_postal_code]
    .map((s: any) => String(s ?? "").trim()).filter(Boolean)
  if (addrParts.length > 0) {
    const addr1 = safeShort(addrParts[0], 32)
    const addr2 = addrParts.slice(1).join(", ").substring(0, 32)
    page.drawText(addr1, { x: rx + 10, y: y - 68, size: 11, font: fontR, color: MUTED })
    if (addr2) page.drawText(addr2, { x: rx + 10, y: y - 82, size: 11, font: fontR, color: MUTED })
  }

  y -= boxH + 20

  // ── FOTO BERDAMPINGAN ────────────────────────────────────────────────────
  const PHOTO_H = 200
  const PHOTO_W = COL

  // Embed kedua foto
  const photoBarang = await embedPhoto(pdfDoc, supabase, items[0]?.photo_url)
  const photoBukti  = await embedPhoto(pdfDoc, supabase, ev?.photo_url)

  // Label
  page.drawText("FOTO BARANG", { x: M, y: y, size: 10, font: fontB, color: MUTED })
  page.drawText("FOTO BUKTI SERAH TERIMA", { x: rx, y: y, size: 10, font: fontB, color: MUTED })
  y -= 14

  // Box kiri — foto barang
  page.drawRectangle({ x: M, y: y - PHOTO_H, width: PHOTO_W, height: PHOTO_H, color: XLIGHT })
  if (photoBarang) {
    const dims = photoBarang.scaleToFit(PHOTO_W, PHOTO_H)
    const ox = M + (PHOTO_W - dims.width) / 2
    const oy = y - PHOTO_H + (PHOTO_H - dims.height) / 2
    page.drawImage(photoBarang, { x: ox, y: oy, width: dims.width, height: dims.height })
  } else {
    page.drawText("Foto tidak tersedia", { x: M + PHOTO_W / 2 - 40, y: y - PHOTO_H / 2, size: 8, font: fontR, color: MUTED })
  }

  // Box kanan — foto bukti
  page.drawRectangle({ x: rx, y: y - PHOTO_H, width: PHOTO_W, height: PHOTO_H, color: XLIGHT })
  if (photoBukti) {
    const dims = photoBukti.scaleToFit(PHOTO_W, PHOTO_H)
    const ox = rx + (PHOTO_W - dims.width) / 2
    const oy = y - PHOTO_H + (PHOTO_H - dims.height) / 2
    page.drawImage(photoBukti, { x: ox, y: oy, width: dims.width, height: dims.height })
  } else {
    page.drawText("Foto tidak tersedia", { x: rx + PHOTO_W / 2 - 40, y: y - PHOTO_H / 2, size: 8, font: fontR, color: MUTED })
  }

  y -= PHOTO_H + 28

  // ── DAFTAR BARANG ────────────────────────────────────────────────────────
  page.drawText("DAFTAR BARANG", { x: M, y, size: 10, font: fontB, color: MUTED })
  y -= 12
  page.drawLine({ start: { x: M, y }, end: { x: M + FULL, y }, thickness: 0.5, color: LIGHT })
  y -= 2

  items.forEach((it: any, idx: number) => {
    y -= 18
    page.drawText(`${idx + 1}.`, { x: M, y, size: 13, font: fontR, color: MUTED })
    page.drawText(safeShort(it.description, 70), { x: M + 22, y, size: 13, font: fontR, color: INK })
    page.drawLine({ start: { x: M, y: y - 5 }, end: { x: M + FULL, y: y - 5 }, thickness: 0.3, color: XLIGHT })
  })

  y -= 20

  // ── CATATAN ──────────────────────────────────────────────────────────────
  if (h.notes?.trim()) {
    page.drawText("CATATAN", { x: M, y, size: 10, font: fontB, color: MUTED })
    y -= 14
    page.drawRectangle({ x: M, y: y - 28, width: FULL, height: 32, color: XLIGHT })
    page.drawText(safeShort(h.notes, 80), { x: M + 10, y: y - 18, size: 13, font: fontR, color: INK })
    y -= 44
  }

  // ── DETAIL PENERIMAAN (2 kolom) ──────────────────────────────────────────
  y -= 20
  page.drawText("DETAIL PENERIMAAN", { x: M, y, size: 10, font: fontB, color: MUTED })
  page.drawText("VERIFIKASI DIGITAL", { x: rx, y, size: 10, font: fontB, color: MUTED })
  y -= 12
  page.drawLine({ start: { x: M, y }, end: { x: M + FULL, y }, thickness: 0.5, color: LIGHT })

  const detailLeft: [string, string][] = [
    ["Metode",    methodLabel(ev?.receive_method)],
    ["Waktu",     shortDate(ev?.received_at || h.received_at || h.created_at)],
  ]
  if (ev?.receiver_name) detailLeft.push(["Diterima oleh", safeShort(ev.receiver_name, 28)])
  if (ev?.receiver_relation) detailLeft.push(["Hubungan", safeShort(ev.receiver_relation, 28)])

  const detailRight: [string, string][] = [
    ["TX ID", safe(h.id, "").substring(0, 16).toUpperCase()],
    ["Device", safeShort(ev?.device_model || ev?.device_id || "System Verified", 26)],
    ["Status", "VERIFIED BY NEST-CORE"],
  ]
  if (ev?.gps_lat && ev?.gps_lng) {
    detailLeft.push(["GPS", `${Number(ev.gps_lat).toFixed(5)}, ${Number(ev.gps_lng).toFixed(5)}`])
    if (ev?.gps_accuracy) detailLeft.push(["Akurasi", `±${Math.round(Number(ev.gps_accuracy))} meter`])
  }

  const maxRows = Math.max(detailLeft.length, detailRight.length)
  for (let i = 0; i < maxRows; i++) {
    y -= 18
    if (detailLeft[i]) {
      page.drawText(detailLeft[i][0] + ":", { x: M, y, size: 9, font: fontR, color: MUTED })
      page.drawText(detailLeft[i][1], { x: M + 80, y, size: 9, font: fontB, color: INK })
    }
    if (detailRight[i]) {
      page.drawText(detailRight[i][0] + ":", { x: rx, y, size: 9, font: fontR, color: MUTED })
      page.drawText(detailRight[i][1], { x: rx + 52, y, size: 9, font: fontB, color: INK })
    }
  }

  // ── FOOTER ───────────────────────────────────────────────────────────────
  const footerY = 56
  page.drawLine({ start: { x: M, y: footerY + 36 }, end: { x: M + FULL, y: footerY + 36 }, thickness: 0.5, color: LIGHT })
  page.drawText("Dokumen ini diterbitkan otomatis oleh NEST76 STUDIO", { x: M, y: footerY + 22, size: 13, font: fontR, color: MUTED })
  page.drawText("dan berlaku sebagai bukti serah terima digital yang sah.", { x: M, y: footerY + 6, size: 13, font: fontR, color: MUTED })
  page.drawText("© 2026 NEST76 STUDIO  |  nest76.com", {
    x: M, y: footerY - 10, size: 13, font: fontR, color: MUTED
  })

  // Timestamp di kanan footer
  const ts = shortDate(new Date().toISOString())
  const tsW = fontR.widthOfTextAtSize(`Digenerate: ${ts}`, 13)
  page.drawText(`Digenerate: ${ts}`, {
    x: A4_W - M - tsW, y: footerY - 10, size: 13, font: fontR, color: MUTED
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
