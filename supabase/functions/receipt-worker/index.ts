/**
 * Receipt PDF worker — pdf-lib only (single A4 page: header, 3 item rows, Digital Trust).
 * Invoked via HTTP POST (cron). Claims one job, builds PDF, uploads to nest-evidence.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1"

const A4_W = 595.28
const A4_H = 841.89
/** Tight margins so header + 3 rows + trust + footer stay on one page */
const M = 32
/** Smaller thumb so 3 rows + trust always fit A4 */
const PHOTO = 52
const MAX_ITEMS = 3
const DESC_SIZE = 7
const DESC_LINE = 8
const MAX_DESC_LINES = 2

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type"
}

function env(key: string): string | undefined {
  return Deno.env.get(key) ?? undefined
}

function storageBucket(): string {
  return (
    env("SUPABASE_STORAGE_BUCKET") ??
    env("NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET") ??
    "nest-evidence"
  )
}

function publicBaseUrl(): string {
  const u = env("SUPABASE_URL") ?? env("NEXT_PUBLIC_SUPABASE_URL") ?? ""
  return String(u).replace(/\/$/, "")
}

/** Same rules as lib/nest-evidence-upload resolveNestEvidencePublicUrl */
function resolvePublicUrl(stored: string | null | undefined): string | null {
  if (stored == null || typeof stored !== "string") return null
  const trimmed = stored.trim()
  if (!trimmed) return null
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed
  }
  const base = publicBaseUrl()
  if (!base) return null
  const bucket = storageBucket()
  let key = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed
  const bucketPrefix = `${bucket}/`
  if (key.startsWith(bucketPrefix)) key = key.slice(bucketPrefix.length)
  const encoded = key
    .split("/")
    .filter(Boolean)
    .map((seg) => encodeURIComponent(seg))
    .join("/")
  return `${base}/storage/v1/object/public/${bucket}/${encoded}`
}

function buildReceiptPdfPath(userId: string, handoverId: string): string {
  return `paket/${userId}/${handoverId}/receipt_${handoverId}.pdf`
}

function formatIdDate(dateStr: string | undefined | null): string {
  if (!dateStr) return "-"
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return "-"
  return (
    new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta"
    }).format(d) + " WIB"
  )
}

function formatMetode(method: string | undefined | null): string {
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
      return method || "-"
  }
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

function formatGps(lat: unknown, lng: unknown): string {
  const g = parseGps(lat, lng)
  if (!g) return "—"
  return `${g.lat.toFixed(6)}, ${g.lng.toFixed(6)}`
}

function shorten(s: string | null | undefined, max = 96): string {
  if (!s?.trim()) return "—"
  const t = s.trim()
  if (t.length <= max) return t
  return `${t.slice(0, Math.max(0, max - 1))}…`
}

function formatDeviceLine(
  deviceModel: string | null | undefined,
  deviceId: string | null | undefined
): string {
  const m = deviceModel?.trim() || "—"
  const id = shorten(deviceId, 120)
  return `${m} (${id})`
}

async function fetchBytes(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return new Uint8Array(await res.arrayBuffer())
  } catch {
    return null
  }
}

async function embedRaster(pdf: PDFDocument, bytes: Uint8Array) {
  const jpg = await pdf.embedJpg(bytes).catch(() => null)
  if (jpg) return jpg
  return await pdf.embedPng(bytes).catch(() => null)
}

function wrapWords(
  text: string,
  font: { widthOfTextAtSize: (t: string, s: number) => number },
  size: number,
  maxWidth: number
): string[] {
  if (!text.trim()) return ["—"]
  const words = text.trim().split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ""
  for (const w of words) {
    const tryLine = line ? `${line} ${w}` : w
    if (font.widthOfTextAtSize(tryLine, size) <= maxWidth) {
      line = tryLine
    } else {
      if (line) lines.push(line)
      line = w
    }
  }
  if (line) lines.push(line)
  return lines.length ? lines : ["—"]
}

/** At most `maxLines` lines; overflow merged into last line with … */
function fitDescriptionLines(
  raw: string,
  font: { widthOfTextAtSize: (t: string, s: number) => number },
  size: number,
  maxWidth: number,
  maxLines: number
): string[] {
  const full = wrapWords(raw.trim() || "—", font, size, maxWidth)
  if (full.length <= maxLines) return full
  const head = full.slice(0, maxLines - 1)
  let last = full.slice(maxLines - 1).join(" ")
  while (last.length > 1 && font.widthOfTextAtSize(`${last.slice(0, -1)}…`, size) > maxWidth) {
    last = last.slice(0, -1)
  }
  return [...head, `${last}…`]
}

type ProfileRow = { company_name: string | null; company_logo_url: string | null }

type HandoverBundle = {
  handover: Record<string, unknown> & {
    id: string
    user_id: string
    handover_items?: unknown
    receive_event?: unknown
  }
  profiles: ProfileRow | null
}

/**
 * PostgREST cannot embed `profiles` on `handover` without an FK handover → profiles.
 * We fetch profiles in parallel with handover+items+receive_event (same data as receipt-data).
 */
async function loadHandoverBundle(
  supabase: ReturnType<typeof createClient>,
  handoverId: string,
  userId: string
): Promise<HandoverBundle | null> {
  const [hRes, pRes] = await Promise.all([
    supabase
      .from("handover")
      .select(
        `
        *,
        handover_items (*),
        receive_event (*)
      `
      )
      .eq("id", handoverId)
      .single(),
    supabase
      .from("profiles")
      .select("company_name, company_logo_url")
      .eq("id", userId)
      .maybeSingle()
  ])

  if (hRes.error || !hRes.data) {
    console.error("[receipt-worker] handover load", hRes.error)
    return null
  }

  return {
    handover: hRes.data as HandoverBundle["handover"],
    profiles: pRes.data as ProfileRow | null
  }
}

async function buildReceiptPdf(bundle: HandoverBundle): Promise<Uint8Array> {
  const h = bundle.handover
  const rawItems = (Array.isArray(h.handover_items) ? h.handover_items : []).slice(
    0,
    MAX_ITEMS
  ) as Array<{
    description?: string
    photo_url?: string | null
  }>
  const items: Array<{
    description?: string
    photo_url?: string | null
  }> = [...rawItems]
  while (items.length < MAX_ITEMS) {
    items.push({ description: "", photo_url: null })
  }

  let ev = h.receive_event
  if (Array.isArray(ev)) ev = ev[0]
  const evObj = (ev ?? null) as Record<string, unknown> | null

  const pdf = await PDFDocument.create()
  const page = pdf.addPage([A4_W, A4_H])
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const companyName =
    typeof bundle.profiles?.company_name === "string"
      ? bundle.profiles.company_name.trim()
      : ""
  const logoUrl =
    companyName && bundle.profiles?.company_logo_url
      ? resolvePublicUrl(bundle.profiles.company_logo_url)
      : null

  let y = A4_H - M
  const left = M
  const right = A4_W - M
  const textW = right - left

  if (logoUrl) {
    const bytes = await fetchBytes(logoUrl)
    if (bytes) {
      const img = await embedRaster(pdf, bytes)
      if (img) {
        const scale = Math.min(36 / img.width, 36 / img.height)
        const w = img.width * scale
        const hgt = img.height * scale
        page.drawImage(img, { x: left, y: y - hgt, width: w, height: hgt })
      }
    }
  }

  const title = companyName || "Tanda Terima"
  page.drawText(title, {
    x: logoUrl ? left + 44 : left,
    y: y - 18,
    size: 15,
    font: fontBold,
    color: rgb(0.24, 0.15, 0.13)
  })
  page.drawText("Bukti Serah Terima Digital", {
    x: logoUrl ? left + 44 : left,
    y: y - 32,
    size: 8,
    font,
    color: rgb(0.6, 0.56, 0.53)
  })

  if (h.serial_number) {
    const sn = String(h.serial_number)
    const w = fontBold.widthOfTextAtSize(sn, 9)
    page.drawText(sn, {
      x: right - w,
      y: y - 18,
      size: 9,
      font: fontBold,
      color: rgb(0.24, 0.15, 0.13)
    })
  }

  y -= 44
  page.drawLine({
    start: { x: left, y },
    end: { x: right, y },
    thickness: 0.5,
    color: rgb(0.93, 0.91, 0.89)
  })
  y -= 16

  const lines: Array<{ label: string; value: string }> = [
    { label: "Pengirim", value: String(h.sender_name ?? "-") },
    { label: "Penerima (target)", value: String(h.receiver_target_name ?? "-") },
    {
      label: "Status",
      value: String(h.status ?? "-")
    }
  ]

  for (const row of lines) {
    page.drawText(`${row.label}:`, {
      x: left,
      y: y - 10,
      size: 9,
      font,
      color: rgb(0.6, 0.56, 0.53)
    })
    page.drawText(row.value, {
      x: left + 108,
      y: y - 10,
      size: 9,
      font: fontBold,
      color: rgb(0.24, 0.15, 0.13)
    })
    y -= 14
  }

  y -= 6
  page.drawText("Item paket (3 baris)", {
    x: left,
    y: y - 10,
    size: 9,
    font: fontBold,
    color: rgb(0.24, 0.15, 0.13)
  })
  y -= 16

  const ROW_GAP = 6
  const descX = left + PHOTO + 10
  const maxDescW = right - descX

  for (let i = 0; i < MAX_ITEMS; i++) {
    const it = items[i]
    const boxY = y - PHOTO
    page.drawRectangle({
      x: left,
      y: boxY,
      width: PHOTO,
      height: PHOTO,
      borderColor: rgb(0.75, 0.72, 0.69),
      borderWidth: 0.75
    })

    const pUrl = it.photo_url ? resolvePublicUrl(String(it.photo_url)) : null
    if (pUrl) {
      const b = await fetchBytes(pUrl)
      if (b) {
        const img = await embedRaster(pdf, b)
        if (img) {
          const scale = Math.min(
            (PHOTO - 4) / img.width,
            (PHOTO - 4) / img.height
          )
          const iw = img.width * scale
          const ih = img.height * scale
          const ix = left + (PHOTO - iw) / 2
          const iy = boxY + (PHOTO - ih) / 2
          page.drawImage(img, { x: ix, y: iy, width: iw, height: ih })
        }
      }
    }

    const desc = String(it.description ?? "").trim() || "—"
    const descLines = fitDescriptionLines(
      desc,
      font,
      DESC_SIZE,
      maxDescW,
      MAX_DESC_LINES
    )
    let ty = y - 10
    for (const dl of descLines) {
      page.drawText(dl, {
        x: descX,
        y: ty,
        size: DESC_SIZE,
        font,
        color: rgb(0.24, 0.15, 0.13)
      })
      ty -= DESC_LINE
    }

    y = boxY - ROW_GAP
  }

  y -= 4

  const receiveWhen =
    (evObj?.timestamp as string) ||
    (evObj?.created_at as string) ||
    ""
  const handoverTs = formatIdDate(receiveWhen)
  const gpsCoords = evObj
    ? formatGps(evObj.gps_lat, evObj.gps_lng)
    : "—"
  const deviceLine = formatDeviceLine(
    evObj?.device_model as string | undefined,
    evObj?.device_id as string | undefined
  )
  const metode = formatMetode(evObj?.receive_method as string | undefined)

  const clipTrust = (s: string, max = 82) => {
    const t = s.trim()
    if (t.length <= max) return t
    return `${t.slice(0, Math.max(0, max - 1))}…`
  }

  const trustTop = y
  const trustPad = 8
  const trustLines = [
    "VERIFIKASI DIGITAL",
    `Metode: ${clipTrust(metode, 90)}`,
    `Device: ${clipTrust(deviceLine)}`,
    `Timestamp: ${clipTrust(handoverTs, 78)}`,
    `GPS: ${clipTrust(gpsCoords, 78)}`
  ]
  const trustLineH = 9
  const th = trustPad * 2 + 10 + (trustLines.length - 1) * trustLineH + 4
  page.drawRectangle({
    x: left,
    y: trustTop - th,
    width: right - left,
    height: th,
    color: rgb(0.96, 0.96, 0.96),
    borderColor: rgb(0.88, 0.86, 0.84),
    borderWidth: 0.5
  })
  let ty2 = trustTop - trustPad - 8
  for (let i = 0; i < trustLines.length; i++) {
    const t = trustLines[i]
    page.drawText(t, {
      x: left + trustPad,
      y: ty2,
      size: i === 0 ? 7 : 7.5,
      font: i === 0 ? fontBold : font,
      color: rgb(0.35, 0.33, 0.31)
    })
    ty2 -= i === 0 ? 12 : trustLineH
  }

  y = trustTop - th - 10

  const disclaimer =
    "Dokumen ini merupakan Tanda Terima Sah yang diterbitkan secara otomatis oleh NEST-System. " +
    "Keaslian data dijamin melalui verifikasi Device ID, Timestamp, dan Geo-tagging sebagai pengganti tanda tangan basah."

  {
    let line = ""
    const words = disclaimer.split(/\s+/)
    const footSize = 6
    let fy = y
    const lineStep = 7
    for (const w of words) {
      const tryLine = line ? `${line} ${w}` : w
      if (font.widthOfTextAtSize(tryLine, footSize) <= textW) {
        line = tryLine
      } else {
        if (line) {
          page.drawText(line, {
            x: left,
            y: fy,
            size: footSize,
            font,
            color: rgb(0.6, 0.56, 0.53)
          })
          fy -= lineStep
        }
        line = w
      }
    }
    if (line) {
      page.drawText(line, {
        x: left,
        y: fy,
        size: footSize,
        font,
        color: rgb(0.6, 0.56, 0.53)
      })
    }
  }

  return pdf.save()
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const supabaseUrl = env("SUPABASE_URL")
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !serviceKey) {
    return new Response(
      JSON.stringify({ ok: false, error: "Missing Supabase env" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  const { data: claimed, error: claimErr } = await supabase.rpc(
    "claim_handover_receipt_job"
  )

  if (claimErr) {
    console.error("[receipt-worker] claim", claimErr)
    return new Response(
      JSON.stringify({ ok: false, error: claimErr.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  const rows = Array.isArray(claimed) ? claimed : claimed ? [claimed] : []
  const job = rows[0] as { id: string; user_id: string } | undefined
  if (!job?.id || !job.user_id) {
    return new Response(JSON.stringify({ ok: true, processed: 0 }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }

  const handoverId = job.id
  const userId = job.user_id

  try {
    const bundle = await loadHandoverBundle(supabase, handoverId, userId)
    if (!bundle) {
      await supabase
        .from("handover")
        .update({ receipt_status: "pending" })
        .eq("id", handoverId)
      throw new Error("load_handover_failed")
    }

    const pdfBytes = await buildReceiptPdf(bundle)
    const bucket = storageBucket()
    const objectPath = buildReceiptPdfPath(userId, handoverId)

    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(objectPath, pdfBytes, {
        contentType: "application/pdf",
        upsert: true
      })

    if (upErr) {
      console.error("[receipt-worker] upload", upErr)
      await supabase
        .from("handover")
        .update({ receipt_status: "pending" })
        .eq("id", handoverId)
      throw upErr
    }

    await supabase
      .from("handover")
      .update({
        receipt_url: objectPath,
        receipt_status: "complete",
        receipt_generated_at: new Date().toISOString()
      })
      .eq("id", handoverId)

    return new Response(
      JSON.stringify({ ok: true, processed: 1, handover_id: handoverId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("[receipt-worker] error", e)
    await supabase
      .from("handover")
      .update({ receipt_status: "pending" })
      .eq("id", handoverId)
    return new Response(
      JSON.stringify({ ok: false, error: msg, handover_id: handoverId }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
