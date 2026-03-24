import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Canonical nest-evidence layout (one “room” per handover):
 * `paket/{user_id}/{handover_id}/…` — photos + receipt PDF live together.
 */

function readEnv(key: string): string | undefined {
  if (typeof process !== "undefined" && process.env?.[key]) {
    return process.env[key]
  }
  const DenoEnv = (
    globalThis as unknown as {
      Deno?: { env: { get: (k: string) => string | undefined } }
    }
  ).Deno?.env
  return DenoEnv?.get(key)
}

/** Must match the Supabase Storage bucket name (default used in migrations: nest-evidence). */
export const NEST_EVIDENCE_BUCKET =
  readEnv("NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET") ??
  readEnv("SUPABASE_STORAGE_BUCKET") ??
  "nest-evidence"

export type EvidencePhotoType = "package" | "proof"

function safeStamp() {
  return Date.now()
}

/** Relative folder key: `paket/{user_id}/{handover_id}` (no trailing slash). */
export function buildPaketRoomRelativePath(
  userId: string,
  handoverId: string
): string {
  return `paket/${userId}/${handoverId}`
}

/** Logistics photos: `paket/{user_id}/{handover_id}/{type}_{timestamp}.jpg` */
export function buildPaketObjectPath(
  userId: string,
  handoverId: string,
  type: "paket" | "proof"
): string {
  return `${buildPaketRoomRelativePath(userId, handoverId)}/${type}_${safeStamp()}.jpg`
}

/** Receipt PDF: `paket/{user_id}/{handover_id}/receipt_{handover_id}.pdf` */
export function buildPaketReceiptPdfPath(
  userId: string,
  handoverId: string
): string {
  return `${buildPaketRoomRelativePath(userId, handoverId)}/receipt_${handoverId}.pdf`
}

/**
 * DB stores relative object keys (or legacy full URLs). Resolves to a public URL for images, PDFs, etc.
 */
export function resolveNestEvidencePublicUrl(
  stored: string | null | undefined
): string | null {
  if (stored == null || typeof stored !== "string") return null
  const trimmed = stored.trim()
  if (!trimmed) return null
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed
  }
  const rawBase =
    readEnv("NEXT_PUBLIC_SUPABASE_URL") ?? readEnv("SUPABASE_URL") ?? ""
  const base = rawBase.replace(/\/$/, "")
  if (!base) return null
  const key = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed
  const encoded = key
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/")
  return `${base}/storage/v1/object/public/${NEST_EVIDENCE_BUCKET}/${encoded}`
}

/** @deprecated Use {@link resolveNestEvidencePublicUrl} */
export function resolveEvidencePhotoUrl(
  stored: string | null | undefined
): string | null {
  return resolveNestEvidencePublicUrl(stored)
}

/**
 * @deprecated Prefer {@link buildPaketObjectPath}
 * Same room layout: `paket/{user_id}/{handover_id}/…`
 */
export function buildHandoverPhotoPath(
  userId: string,
  handoverId: string,
  filenameBase = "photo"
): string {
  const safe =
    String(filenameBase)
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 80) || "photo"
  return `${buildPaketRoomRelativePath(userId, handoverId)}/${safeStamp()}_${safe}.jpg`
}

/**
 * Legacy name kept for compatibility; paths now use the paket room layout.
 * `paket/{user_id}/{handover_id}/{photoType}_{timestamp}_{filename}.jpg`
 */
export function buildEvidenceObjectPath(
  userId: string,
  handoverId: string,
  photoType: EvidencePhotoType,
  filenameBase = "photo"
): string {
  return `${buildPaketRoomRelativePath(userId, handoverId)}/${photoType}_${safeStamp()}_${filenameBase}.jpg`
}

export function buildProfileLogoPath(userId: string): string {
  return `${userId}/profile/logo.png`
}

export async function uploadJpegToNestEvidence(
  supabase: SupabaseClient,
  path: string,
  body: Blob,
  options?: { upsert?: boolean }
): Promise<{ publicUrl: string }> {
  const { error } = await supabase.storage
    .from(NEST_EVIDENCE_BUCKET)
    .upload(path, body, {
      contentType: "image/jpeg",
      upsert: options?.upsert ?? false
    })

  if (error) throw error

  const { data } = supabase.storage.from(NEST_EVIDENCE_BUCKET).getPublicUrl(path)
  return { publicUrl: data.publicUrl }
}

export async function uploadPngToNestEvidence(
  supabase: SupabaseClient,
  path: string,
  body: Blob,
  options?: { upsert?: boolean }
): Promise<{ publicUrl: string }> {
  const { error } = await supabase.storage
    .from(NEST_EVIDENCE_BUCKET)
    .upload(path, body, {
      contentType: "image/png",
      upsert: options?.upsert ?? false
    })

  if (error) throw error

  const { data } = supabase.storage.from(NEST_EVIDENCE_BUCKET).getPublicUrl(path)
  return { publicUrl: data.publicUrl }
}
