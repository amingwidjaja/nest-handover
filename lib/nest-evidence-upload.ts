import type { SupabaseClient } from "@supabase/supabase-js"

/** Must match the Supabase Storage bucket name (default used in migrations: nest-evidence). */
export const NEST_EVIDENCE_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "nest-evidence"

export type EvidencePhotoType = "package" | "proof"

function safeStamp() {
  return Date.now()
}

/** Logistics photos under bucket root: `paket/{user_id}/{handover_id}/{type}_{timestamp}.jpg` */
export function buildPaketObjectPath(
  userId: string,
  handoverId: string,
  type: "paket" | "proof"
): string {
  return `paket/${userId}/${handoverId}/${type}_${safeStamp()}.jpg`
}

/** Generated receipt PDF: `paket/{user_id}/{handover_id}/receipt_{handover_id}.pdf` */
export function buildPaketReceiptPdfPath(
  userId: string,
  handoverId: string
): string {
  return `paket/${userId}/${handoverId}/receipt_${handoverId}.pdf`
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
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? ""
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
 */
export function buildHandoverPhotoPath(
  handoverId: string,
  filenameBase = "photo"
): string {
  const safe = String(filenameBase)
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 80) || "photo"
  return `${handoverId}/${safeStamp()}_${safe}.jpg`
}

/**
 * Legacy path: `[user_id]/[photo_type]/[timestamp]_[filename].jpg`
 * Prefer {@link buildHandoverPhotoPath} for new uploads.
 */
export function buildEvidenceObjectPath(
  userId: string,
  photoType: EvidencePhotoType,
  filenameBase = "photo"
): string {
  return `${userId}/${photoType}/${safeStamp()}_${filenameBase}.jpg`
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
