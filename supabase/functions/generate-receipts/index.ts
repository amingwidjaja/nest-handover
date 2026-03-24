/**
 * Receipt PDF worker — pdf-lib only (Deno / Supabase Edge).
 * JPEG/PNG embedded in a clean A4 PDF. WebP objects are skipped (not supported by pdf-lib).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage
} from "npm:pdf-lib@1.17.1"

const NEST_EVIDENCE_BUCKET =
  Deno.env.get("SUPABASE_STORAGE_BUCKET") ?? "nest-evidence"

function buildPaketReceiptPdfPath(userId: string, handoverId: string): string {
  return `paket/${userId}/${handoverId}/receipt_${handoverId}.pdf`
}

function resolvePublicObjectUrl(
  stored: string | null | undefined,
  supabaseUrl: string,
  bucket: string
): string | null {
  if (stored == null || typeof stored !== "string") return null
  const trimmed = stored.trim()
  if (!trimmed) return null
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed
  }
  const base = supabaseUrl.replace(/\/$/, "")
  let key = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed
  const bucketPrefix = `${bucket}/`
  if (key.startsWith(bucketPrefix)) key = key.slice(bucketPrefix.length)
  const encoded = key
    .split("/")
    .filter(Boolean)
    .map((s) => encodeURIComponent(s))
    .join("/")
  return `${base}/storage/v1/object/public/${bucket}/${encoded}`
}

function normalizeReceiveEvent(raw: unknown): Record<string, unknown> {
  if (raw == null) return {}
  if (Array.isArray(raw)) return (raw[0] as Record<string, unknown>) ?? {}
  return raw as Record<string, unknown>
}

function parseGps(
  lat: unknown,
  lng: unknown
): { lat: number; lng: number } | null {
  if (lat == null || lng == null) return null
  const a = typeof lat === "string" ? parseFloat(lat) : Number(lat)
  const b = typeof lng === "string" ? parseFloat(lng) : Number(lng)
  if (Number.isNaN(a) || Number.isNaN(b)) return null
  return { lat: a, lng: b }
}

function formatGpsCoords(lat: unknown, lng: unknown): string {
  const g = parseGps(lat, lng)
  if (!g) return "—"
  return `${g.lat.toFixed(6)}, ${g.lng.toFixed(6)}`
}

function formatDeviceIdLine(
  deviceModel: string | null | undefined,
  deviceId: string | null | undefined
): string {
  const m = deviceModel?.trim() || "—"
  const id = deviceId?.trim() || "—"
  return `${m} (${id})`
}

function shortenDeviceIdForDisplay(
  deviceId: string | null | undefined,
  maxLen = 120
): string {
  if (!deviceId?.trim()) return "—"
  const t = deviceId.trim()
  if (t.length <= maxLen) return t
  return `${t.slice(0, Math.max(0, maxLen - 1))}…`
}

function formatTrustTimestampHuman(dateStr: string | undefined | null): string {
  if (!dateStr) return "—"
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return "—"
  return (
    new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta"
    }).format(date) + " WIB"
  )
}

function trustTimestampBase36(iso: string | undefined | null): string {
  if (!iso) return "—"
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return "—"
  return Math.floor(t / 1000).toString(36).toUpperCase()
}

function formatMetode(method: string | undefined): string {
  switch (method) {
    case "direct_qr":
      return "QR Code"
    case "direct_photo":
      return "Foto Tanda Terima"
    case "proxy_qr":
      return "QR Code (Diwakilkan)"
    case "proxy_photo":
      return "Foto Tanda Terima (Diwakilkan)"
    case "GPS":
      return "Validasi GPS"
    default:
      return "—"
  }
}

function formatStatus(status: string | undefined): string {
  switch (status) {
    case "draft":
      return "Draft"
    case "created":
      return "Dibuat"
    case "received":
      return "Diterima"
    case "accepted":
      return "Diterima & Disetujui"
    default:
      return status || "—"
  }
}

function formatIndonesianDate(dateStr?: string): string {
  if (!dateStr) return "—"
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ]
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

function formatIndonesianTime(dateStr?: string): string {
  if (!dateStr) return "—"
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr
  const h = String(date.getHours()).padStart(2, "0")
  const m = String(date.getMinutes()).padStart(2, "0")
  return `${h}.${m}`
}

const PAGE_W = 595.28
const PAGE_H = 841.89
const MARGIN = 48
const LABEL = rgb(154 / 255, 143 / 255, 136 / 255)
const VALUE = rgb(62 / 255, 39 / 255, 35 / 255)
const LINE = rgb(236 / 255, 231 / 255, 227 / 255)
const TRUST_BG = rgb(245 / 255, 244 / 255, 242 / 255)
const BORDER = rgb(229 / 255, 224 / 255, 219 / 255)

async function fetchBytes(url: string): Promise<Uint8Array | null> {
  try {
    const r = await fetch(url)
    if (!r.ok) return null
    return new Uint8Array(await r.arrayBuffer())
  } catch {
    return null
  }
}

async function embedRaster(
  pdf: PDFDocument,
  bytes: Uint8Array
): Promise<PDFImage | null> {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    try {
      return await pdf.embedJpg(bytes)
    } catch {
      return null
    }
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    try {
      return await pdf.embedPng(bytes)
    } catch {
      return null
    }
  }
  return null
}

function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number
): string[] {
  const t = text.replace(/\s+/g, " ").trim()
  if (!t) return [""]
  const words = t.split(" ")
  const lines: string[] = []
  let line = ""
  for (const w of words) {
    const next = line ? `${line} ${w}` : w
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      line = next
    } else {
      if (line) lines.push(line)
      if (font.widthOfTextAtSize(w, size) > maxWidth) {
        let chunk = ""
        for (const ch of w) {
          const tryLine = chunk + ch
          if (font.widthOfTextAtSize(tryLine, size) <= maxWidth) chunk = tryLine
          else {
            if (chunk) lines.push(chunk)
            chunk = ch
          }
        }
        line = chunk
      } else line = w
    }
  }
  if (line) lines.push(line)
  return lines
}

function drawWrapped(
  page: PDFPage,
  text: string,
  x: number,
  yTop: number,
  maxWidth: number,
  size: number,
  font: PDFFont,
  color: ReturnType<typeof rgb>,
  lineHeight: number
): number {
  let y = yTop
  for (const ln of wrapText(text, font, size, maxWidth)) {
    page.drawText(ln, { x, y, size, font, color })
    y -= lineHeight
  }
  return y
}

function drawFooter(page: PDFPage, font: PDFFont) {
  const text =
    "Dokumen ini merupakan Tanda Terima Sah yang diterbitkan secara otomatis oleh NEST-System. " +
    "Keaslian data dijamin melalui verifikasi Device ID, Timestamp, dan Geo-tagging."
  const lines = wrapText(text, font, 8, PAGE_W - 2 * MARGIN)
  let fy = MARGIN + lines.length * 9
  for (const ln of lines) {
    page.drawText(ln, {
      x: MARGIN,
      y: fy,
      size: 8,
      font,
      color: LABEL
    })
    fy -= 9
  }
  page.drawText(
    "© 2026 NEST76 Studio. Tanda Terima — generated securely.",
    {
      x: MARGIN,
      y: fy - 6,
      size: 7.5,
      font,
      color: LABEL
    }
  )
}

async function buildReceiptPdfBytes(opts: {
  brandTitle: string
  serial: string | null
  logoBytes: Uint8Array | null
  photoBytes: Uint8Array | null
  senderName: string
  receiverName: string
  status: string | undefined
  items: Array<{ description?: string; photo_url?: string | null }>
  event: Record<string, unknown>
  when: string | undefined
}): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)

  let logoImg: PDFImage | null = null
  let productImg: PDFImage | null = null
  if (opts.logoBytes) logoImg = await embedRaster(pdf, opts.logoBytes)
  if (opts.photoBytes) productImg = await embedRaster(pdf, opts.photoBytes)

  const FOOTER_H = 52
  const bottomMin = MARGIN + FOOTER_H

  let page = pdf.addPage([PAGE_W, PAGE_H])
  let y = PAGE_H - MARGIN

  const lh = 13
  const labelSize = 9
  const bodySize = 11

  const needSpace = (h: number) => {
    if (y - h >= bottomMin) return
    page = pdf.addPage([PAGE_W, PAGE_H])
    y = PAGE_H - MARGIN
  }

  // --- Header (logo left, titles, serial right) ---
  const headerTop = PAGE_H - MARGIN
  const logoSize = 44
  if (logoImg) {
    page.drawImage(logoImg, {
      x: MARGIN,
      y: headerTop - logoSize,
      width: logoSize,
      height: logoSize
    })
  }
  const textX = logoImg ? MARGIN + logoSize + 12 : MARGIN
  page.drawText(opts.brandTitle, {
    x: textX,
    y: headerTop - 18,
    size: 18,
    font: fontBold,
    color: VALUE
  })
  page.drawText("OFFICIAL RECEIPT", {
    x: textX,
    y: headerTop - 34,
    size: 10,
    font: fontRegular,
    color: LABEL
  })
  if (opts.serial) {
    const sw = fontBold.widthOfTextAtSize(opts.serial, 11)
    page.drawText(opts.serial, {
      x: PAGE_W - MARGIN - sw,
      y: headerTop - 18,
      size: 11,
      font: fontBold,
      color: VALUE
    })
  }

  y = headerTop - logoSize - 8
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_W - MARGIN, y },
    thickness: 0.5,
    color: LINE
  })
  y -= 20

  // --- Two columns: Sender | Receiver ---
  const colW = (PAGE_W - 2 * MARGIN - 16) / 2
  const leftX = MARGIN
  const rightX = MARGIN + colW + 16
  page.drawText("Pengirim", {
    x: leftX,
    y,
    size: labelSize,
    font: fontRegular,
    color: LABEL
  })
  page.drawText("Penerima", {
    x: rightX,
    y,
    size: labelSize,
    font: fontRegular,
    color: LABEL
  })
  y -= 16
  const yL = drawWrapped(
    page,
    opts.senderName || "—",
    leftX,
    y,
    colW,
    bodySize,
    fontRegular,
    VALUE,
    lh
  )
  const yR = drawWrapped(
    page,
    opts.receiverName || "—",
    rightX,
    y,
    colW,
    bodySize,
    fontRegular,
    VALUE,
    lh
  )
  y = Math.min(yL, yR) - 8

  page.drawText("Status", {
    x: leftX,
    y,
    size: labelSize,
    font: fontRegular,
    color: LABEL
  })
  y -= 14
  page.drawText(formatStatus(opts.status), {
    x: leftX,
    y,
    size: bodySize,
    font: fontRegular,
    color: VALUE
  })
  y -= 22

  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_W - MARGIN, y },
    thickness: 0.5,
    color: LINE
  })
  y -= 18

  // --- Product: 120×120 + bullets beside ---
  needSpace(160)
  page.drawText("RINCIAN PAKET", {
    x: MARGIN,
    y,
    size: 10,
    font: fontBold,
    color: LABEL
  })
  y -= 18

  const photoBox = 120
  const gap = 14
  const listX = MARGIN + photoBox + gap
  const listW = PAGE_W - MARGIN - listX
  const photoBottomY = y - photoBox

  page.drawRectangle({
    x: MARGIN,
    y: photoBottomY,
    width: photoBox,
    height: photoBox,
    borderColor: BORDER,
    borderWidth: 1
  })
  if (productImg) {
    page.drawImage(productImg, {
      x: MARGIN,
      y: photoBottomY,
      width: photoBox,
      height: photoBox
    })
  }

  let listY = y
  if (opts.items.length === 0) {
    page.drawText("—", {
      x: listX,
      y: listY,
      size: bodySize,
      font: fontRegular,
      color: VALUE
    })
    listY -= lh
  } else {
    for (const it of opts.items) {
      const bullet = `• ${String(it.description || "").trim() || "—"}`
      listY = drawWrapped(
        page,
        bullet,
        listX,
        listY,
        listW,
        bodySize,
        fontRegular,
        VALUE,
        lh
      )
    }
  }
  y = Math.min(photoBottomY - 10, listY - 10)

  needSpace(40)
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_W - MARGIN, y },
    thickness: 0.5,
    color: LINE
  })
  y -= 18

  const tz = String(opts.event.timezone_label || "")
  const fd = formatIndonesianDate(opts.when)
  const ft = formatIndonesianTime(opts.when)

  needSpace(120)
  page.drawText("DETAIL PENERIMAAN", {
    x: MARGIN,
    y,
    size: 11,
    font: fontBold,
    color: LABEL
  })
  y -= 20

  const rows: [string, string][] = [
    ["Metode", formatMetode(opts.event.receive_method as string)],
    ["Waktu", `${fd} pukul ${ft} ${tz}`.trim()],
    ["Diterima oleh", String(opts.event.receiver_name || "—")],
    ["Hubungan", String(opts.event.receiver_relation || "—")]
  ]
  for (const [lab, val] of rows) {
    needSpace(lh + 4)
    page.drawText(`${lab}:`, {
      x: MARGIN,
      y,
      size: labelSize,
      font: fontRegular,
      color: LABEL
    })
    y = drawWrapped(
      page,
      val,
      MARGIN + 118,
      y,
      PAGE_W - MARGIN - 130,
      bodySize,
      fontRegular,
      VALUE,
      lh
    )
    y -= 4
  }

  y -= 6
  const closing = `Paket telah diterima oleh ${String(opts.event.receiver_name || "—")} pada tanggal ${fd} pukul ${ft} ${tz} melalui metode ${formatMetode(opts.event.receive_method as string)}.`
  needSpace(40)
  y = drawWrapped(
    page,
    closing,
    MARGIN,
    y,
    PAGE_W - 2 * MARGIN,
    10,
    fontRegular,
    VALUE,
    lh
  )
  y -= 16

  // --- Grey trust block ---
  const deviceLine = formatDeviceIdLine(
    opts.event.device_model as string,
    shortenDeviceIdForDisplay(opts.event.device_id as string, 120)
  )
  const gpsLine = formatGpsCoords(opts.event.gps_lat, opts.event.gps_lng)
  const trustHuman = formatTrustTimestampHuman(opts.when)
  const trustB36 = trustTimestampBase36(opts.when)

  const pad = 12
  const trustTextW = PAGE_W - 2 * MARGIN - 2 * pad
  const devLines = wrapText(
    `Device ID: ${deviceLine}`,
    fontRegular,
    9,
    trustTextW
  )
  const gpsLines = wrapText(`GPS: ${gpsLine}`, fontRegular, 9, trustTextW)
  const boxH =
    pad * 2 +
    14 +
    devLines.length * lh +
    gpsLines.length * lh +
    lh +
    lh +
    8

  needSpace(boxH + 12)

  const boxBottom = y - boxH
  page.drawRectangle({
    x: MARGIN,
    y: boxBottom,
    width: PAGE_W - 2 * MARGIN,
    height: boxH,
    color: TRUST_BG,
    borderColor: BORDER,
    borderWidth: 0.5
  })

  let iy = y - pad - 12
  page.drawText("DIGITAL VERIFICATION", {
    x: MARGIN + pad,
    y: iy,
    size: 11,
    font: fontBold,
    color: VALUE
  })
  iy -= 18
  for (const ln of devLines) {
    page.drawText(ln, {
      x: MARGIN + pad,
      y: iy,
      size: 9,
      font: fontRegular,
      color: VALUE
    })
    iy -= lh
  }
  for (const ln of gpsLines) {
    page.drawText(ln, {
      x: MARGIN + pad,
      y: iy,
      size: 9,
      font: fontRegular,
      color: VALUE
    })
    iy -= lh
  }
  page.drawText(`Timestamp: ${trustHuman}`, {
    x: MARGIN + pad,
    y: iy,
    size: 9,
    font: fontRegular,
    color: VALUE
  })
  iy -= lh
  page.drawText(`Trust seal (Base36): ${trustB36}`, {
    x: MARGIN + pad,
    y: iy,
    size: 9,
    font: fontRegular,
    color: VALUE
  })

  y = boxBottom - 8

  const pages = pdf.getPages()
  drawFooter(pages[pages.length - 1], fontRegular)

  return pdf.save()
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

Deno.serve(async () => {
  try {
    const { data: claimedId, error: claimErr } = await supabase.rpc(
      "claim_handover_receipt_job"
    )

    if (claimErr) {
      return new Response(JSON.stringify({ error: claimErr.message }), {
        status: 500
      })
    }

    const handoverId =
      claimedId != null && claimedId !== "" ? String(claimedId) : null

    if (!handoverId) {
      return new Response(JSON.stringify({ success: true, empty: true }), {
        status: 200
      })
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""

    const { data: row, error: fetchErr } = await supabase
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
      .eq("id", handoverId)
      .single()

    if (fetchErr || !row) {
      await supabase
        .from("handover")
        .update({ receipt_status: "failed" })
        .eq("id", handoverId)
      return new Response(
        JSON.stringify({ error: fetchErr?.message || "handover not found" }),
        { status: 500 }
      )
    }

    const data = row as {
      id: string
      user_id: string
      receipt_url: string | null
      serial_number?: string | null
      status?: string
      sender_name?: string | null
      receiver_target_name?: string | null
      received_at?: string | null
      handover_items?: Array<{ description?: string; photo_url?: string | null }>
      receive_event?: unknown
    }

    if (!data.user_id) {
      await supabase
        .from("handover")
        .update({ receipt_status: "failed" })
        .eq("id", data.id)
      return new Response(
        JSON.stringify({ error: "handover tanpa user_id" }),
        { status: 500 }
      )
    }

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

    const event = normalizeReceiveEvent(data.receive_event)
    const items = data.handover_items ?? []
    const when = (event.timestamp as string) || (event.created_at as string)
    const companyName = (profile?.company_name as string | undefined)?.trim()
    const brandTitle = companyName || "Tanda Terima"
    const logoPath = profile?.company_logo_url as string | undefined
    const logoUrl = logoPath
      ? resolvePublicObjectUrl(logoPath, supabaseUrl, NEST_EVIDENCE_BUCKET)
      : null

    const firstPhotoPath =
      (items[0]?.photo_url && String(items[0].photo_url).trim()
        ? String(items[0].photo_url).trim()
        : null) ||
      items.find((i) => i.photo_url && String(i.photo_url).trim())?.photo_url ||
      null
    const photoUrl = firstPhotoPath
      ? resolvePublicObjectUrl(firstPhotoPath, supabaseUrl, NEST_EVIDENCE_BUCKET)
      : null

    let logoBytes: Uint8Array | null = null
    let photoBytes: Uint8Array | null = null
    if (logoUrl) logoBytes = await fetchBytes(logoUrl)
    if (photoUrl) photoBytes = await fetchBytes(photoUrl)

    const pdfBytes = await buildReceiptPdfBytes({
      brandTitle,
      serial: data.serial_number?.trim() ?? null,
      logoBytes,
      photoBytes,
      senderName: String(data.sender_name || "—"),
      receiverName: String(data.receiver_target_name || "—"),
      status: data.status,
      items,
      event,
      when
    })

    const storagePath = buildPaketReceiptPdfPath(data.user_id, data.id)

    const { error: uploadError } = await supabase.storage
      .from(NEST_EVIDENCE_BUCKET)
      .upload(storagePath, pdfBytes, {
        contentType: "application/pdf",
        upsert: true
      })

    if (uploadError) {
      await supabase
        .from("handover")
        .update({ receipt_status: "failed" })
        .eq("id", data.id)
      return new Response(JSON.stringify({ error: uploadError.message }), {
        status: 500
      })
    }

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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "error"
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
})
