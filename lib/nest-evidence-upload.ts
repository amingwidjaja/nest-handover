import type { SupabaseClient } from "@supabase/supabase-js"

/** Must match the Supabase Storage bucket name (default used in migrations: nest-evidence). */
export const NEST_EVIDENCE_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "nest-evidence"

export type EvidencePhotoType = "package" | "proof"

function safeStamp() {
  return Date.now()
}

/**
 * Path: `{handover_id}/{timestamp}_{filenameBase}.jpg` — simple & receipt-friendly.
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
