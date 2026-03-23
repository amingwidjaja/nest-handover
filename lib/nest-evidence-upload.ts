import type { SupabaseClient } from "@supabase/supabase-js"

export type EvidencePhotoType = "package" | "proof"

function safeStamp() {
  return Date.now()
}

/**
 * Path: `[user_id]/[photo_type]/[timestamp]_[filename].jpg`
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
    .from("nest-evidence")
    .upload(path, body, {
      contentType: "image/jpeg",
      upsert: options?.upsert ?? false
    })

  if (error) throw error

  const { data } = supabase.storage.from("nest-evidence").getPublicUrl(path)
  return { publicUrl: data.publicUrl }
}

export async function uploadPngToNestEvidence(
  supabase: SupabaseClient,
  path: string,
  body: Blob,
  options?: { upsert?: boolean }
): Promise<{ publicUrl: string }> {
  const { error } = await supabase.storage
    .from("nest-evidence")
    .upload(path, body, {
      contentType: "image/png",
      upsert: options?.upsert ?? false
    })

  if (error) throw error

  const { data } = supabase.storage.from("nest-evidence").getPublicUrl(path)
  return { publicUrl: data.publicUrl }
}
