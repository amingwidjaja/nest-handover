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

  // ── HEADER BAR ───────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: y - 2, width: A4_W, height: 34, color: BLACK })
  page.drawText("TANDA TERIMA DIGITAL", {
    x: M, y: y + 6, size: 14, font: fontB, color: rgb(1, 1, 1)
  })
  page.drawText("NEST76 PAKET  |  nest76.com", {
    x: M, y: y - 6, size: 7.5, font: fontR, color: rgb(0.75, 0.75, 0.75)
  })
  if (h.serial_number) {
    const snText = safe(h.serial_number)
    const snW = fontB.widthOfTextAtSize(snText, 9)
    page.drawText(snText, {
      x: A4_W - M - snW, y: y + 2, size: 9, font: fontB, color: rgb(1, 1, 1)
    })
  }
  y -= 44

  // ── PENGIRIM & PENERIMA (2 kolom) ────────────────────────────────────────
  const boxH = 72
  // Pengirim box
  page.drawRectangle({ x: M, y: y - boxH, width: COL, height: boxH, borderColor: LIGHT, borderWidth: 0.5 })
  page.drawText("PENGIRIM", { x: M + 8, y: y - 12, size: 6.5, font: fontB, color: MUTED })
  page.drawText(safeShort(h.sender_name, 36), { x: M + 8, y: y - 24, size: 10, font: fontB, color: INK })
  if (h.sender_whatsapp) {
    page.drawText(safe(h.sender_whatsapp), { x: M + 8, y: y - 36, size: 8, font: fontR, color: MUTED })
  }

  // Penerima box
  const rx = M + COL + 12
  page.drawRectangle({ x: rx, y: y - boxH, width: COL, height: boxH, borderColor: LIGHT, borderWidth: 0.5 })
  page.drawText("PENERIMA", { x: rx + 8, y: y - 12, size: 6.5, font: fontB, color: MUTED })
  page.drawText(safeShort(h.receiver_target_name, 36), { x: rx + 8, y: y - 24, size: 10, font: fontB, color: INK })
  if (h.receiver_whatsapp) {
    page.drawText(safe(h.receiver_whatsapp), { x: rx + 8, y: y - 36, size: 8, font: fontR, color: MUTED })
  }

  // Alamat (kalau ada) — di bawah nama penerima
  const addrParts = [h.destination_address, h.destination_district, h.destination_city, h.destination_postal_code]
    .map((s: any) => String(s ?? "").trim()).filter(Boolean)
  if (addrParts.length > 0) {
    const addr1 = safeShort(addrParts[0], 36)
    const addr2 = addrParts.slice(1).join(", ").substring(0, 36)
    page.drawText(addr1, { x: rx + 8, y: y - 48, size: 7.5, font: fontR, color: MUTED })
    if (addr2) page.drawText(addr2, { x: rx + 8, y: y - 58, size: 7.5, font: fontR, color: MUTED })
  }

  y -= boxH + 16

  // ── FOTO BERDAMPINGAN ────────────────────────────────────────────────────
  const PHOTO_H = 200
  const PHOTO_W = COL

  // Embed kedua foto
  const photoBarang = await embedPhoto(pdfDoc, supabase, items[0]?.photo_url)
  const photoBukti  = await embedPhoto(pdfDoc, supabase, ev?.photo_url)

  // Label
  page.drawText("FOTO BARANG", { x: M, y: y, size: 6.5, font: fontB, color: MUTED })
  page.drawText("FOTO BUKTI SERAH TERIMA", { x: rx, y: y, size: 6.5, font: fontB, color: MUTED })
  y -= 8

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

  y -= PHOTO_H + 16

  // ── DAFTAR BARANG ────────────────────────────────────────────────────────
  page.drawText("DAFTAR BARANG", { x: M, y, size: 6.5, font: fontB, color: MUTED })
  y -= 8
  page.drawLine({ start: { x: M, y }, end: { x: M + FULL, y }, thickness: 0.5, color: LIGHT })
  y -= 1

  items.forEach((it: any, idx: number) => {
    y -= 13
    page.drawText(`${idx + 1}.`, { x: M, y, size: 9, font: fontR, color: MUTED })
    page.drawText(safeShort(it.description, 80), { x: M + 16, y, size: 9, font: fontR, color: INK })
    page.drawLine({ start: { x: M, y: y - 4 }, end: { x: M + FULL, y: y - 4 }, thickness: 0.3, color: XLIGHT })
  })

  y -= 16

  // ── CATATAN ──────────────────────────────────────────────────────────────
  if (h.notes?.trim()) {
    page.drawText("CATATAN", { x: M, y, size: 6.5, font: fontB, color: MUTED })
    y -= 12
    page.drawRectangle({ x: M, y: y - 20, width: FULL, height: 24, color: XLIGHT })
    page.drawText(safeShort(h.notes, 100), { x: M + 8, y: y - 12, size: 9, font: fontR, color: INK })
    y -= 32
  }

  // ── DETAIL PENERIMAAN (2 kolom) ──────────────────────────────────────────
  y -= 4
  page.drawText("DETAIL PENERIMAAN", { x: M, y, size: 6.5, font: fontB, color: MUTED })
  page.drawText("VERIFIKASI DIGITAL", { x: rx, y, size: 6.5, font: fontB, color: MUTED })
  y -= 8
  page.drawLine({ start: { x: M, y }, end: { x: M + FULL, y }, thickness: 0.5, color: LIGHT })

  const detailLeft: [string, string][] = [
    ["Metode",    methodLabel(ev?.receive_method)],
    ["Waktu",     shortDate(ev?.received_at || h.received_at || h.created_at)],
  ]
  if (ev?.receiver_name) detailLeft.push(["Diterima oleh", safeShort(ev.receiver_name, 32)])
  if (ev?.receiver_relation) detailLeft.push(["Hubungan", safeShort(ev.receiver_relation, 32)])

  const detailRight: [string, string][] = [
    ["TX ID", safe(h.id, "").substring(0, 18).toUpperCase()],
    ["Device", safeShort(ev?.device_model || ev?.device_id || "System Verified", 30)],
    ["Status", "VERIFIED BY NEST-CORE"],
  ]
  if (ev?.gps_lat && ev?.gps_lng) {
    detailLeft.push(["GPS", `${Number(ev.gps_lat).toFixed(5)}, ${Number(ev.gps_lng).toFixed(5)}`])
    if (ev?.gps_accuracy) detailLeft.push(["Akurasi", `±${Math.round(Number(ev.gps_accuracy))} meter`])
  }

  const maxRows = Math.max(detailLeft.length, detailRight.length)
  for (let i = 0; i < maxRows; i++) {
    y -= 14
    if (detailLeft[i]) {
      page.drawText(detailLeft[i][0] + ":", { x: M, y, size: 7.5, font: fontR, color: MUTED })
      page.drawText(detailLeft[i][1], { x: M + 64, y, size: 8, font: fontB, color: INK })
    }
    if (detailRight[i]) {
      page.drawText(detailRight[i][0] + ":", { x: rx, y, size: 7.5, font: fontR, color: MUTED })
      page.drawText(detailRight[i][1], { x: rx + 48, y, size: 8, font: fontB, color: INK })
    }
  }

  // ── FOOTER ───────────────────────────────────────────────────────────────
  const footerY = 32
  page.drawLine({ start: { x: M, y: footerY + 20 }, end: { x: M + FULL, y: footerY + 20 }, thickness: 0.5, color: LIGHT })
  page.drawText(
    "Dokumen ini diterbitkan otomatis oleh NEST76 STUDIO dan berlaku sebagai bukti serah terima digital yang sah.",
    { x: M, y: footerY + 8, size: 6.5, font: fontR, color: MUTED }
  )
  page.drawText("© 2026 NEST76 STUDIO  |  nest76.com", {
    x: M, y: footerY - 2, size: 6.5, font: fontR, color: MUTED
  })

  // Serial number + timestamp di kanan footer
  const ts = shortDate(new Date().toISOString())
  page.drawText(`Digenerate: ${ts}`, {
    x: A4_W - M - 160, y: footerY - 2, size: 6.5, font: fontR, color: MUTED
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
