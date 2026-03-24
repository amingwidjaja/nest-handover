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

/**
 * Project URL for Storage public URLs. In the browser, only `NEXT_PUBLIC_SUPABASE_URL`
 * exists in the bundle — `SUPABASE_URL` alone will NOT resolve on the client.
 */
export function getSupabasePublicBaseUrl(): string {
  if (typeof process !== "undefined") {
    const pub = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (pub && String(pub).trim()) {
      return String(pub).replace(/\/$/, "")
    }
    const srv = process.env.SUPABASE_URL
    if (srv && String(srv).trim()) {
      return String(srv).replace(/\/$/, "")
    }
  }
  const fallback =
    readEnv("NEXT_PUBLIC_SUPABASE_URL") ?? readEnv("SUPABASE_URL") ?? ""
  return String(fallback).replace(/\/$/, "")
}

/** Bucket segment in `/storage/v1/object/public/{bucket}/...` — must match actual bucket. */
export function getNestEvidenceBucketForPublicUrl(): string {
  if (typeof process !== "undefined") {
    const pub = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET
    if (pub && String(pub).trim()) return String(pub).trim()
    const srv = process.env.SUPABASE_STORAGE_BUCKET
    if (srv && String(srv).trim()) return String(srv).trim()
  }
  return (
    readEnv("NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET") ??
    readEnv("SUPABASE_STORAGE_BUCKET") ??
    NEST_EVIDENCE_BUCKET
  )
}

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

/** Logistics photos: `paket/{user_id}/{handover_id}/{type}_{timestamp}.webp` (or `.jpg` if upload is JPEG). */
export function buildPaketObjectPath(
  userId: string,
  handoverId: string,
  type: "paket" | "proof",
  ext: "webp" | "jpg" = "webp"
): string {
  const suffix = ext === "jpg" ? "jpg" : "webp"
  return `${buildPaketRoomRelativePath(userId, handoverId)}/${type}_${safeStamp()}.${suffix}`
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
 *
 * Canonical shape:
 * `{NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/{bucket}/{relative_path}`
 * e.g. `.../nest-evidence/paket/{user_id}/{handover_id}/paket_123.webp`
 */
export function resolveNestEvidencePublicUrl(
  stored: string | null | undefined
): string | null {
  if (stored == null || typeof stored !== "string") return null
  const trimmed = stored.trim()
  if (!trimmed) return null
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    if (
      typeof process !== "undefined" &&
      process.env.NODE_ENV === "development"
    ) {
      console.debug("[nest-evidence] using absolute stored URL:", trimmed)
    }
    return trimmed
  }

  const base = getSupabasePublicBaseUrl()
  const bucket = getNestEvidenceBucketForPublicUrl()

  if (!base) {
    console.warn(
      "[nest-evidence] Missing NEXT_PUBLIC_SUPABASE_URL — cannot build Storage public URL. Raw key:",
      trimmed
    )
    return null
  }

  let key = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed
  const bucketPrefix = `${bucket}/`
  if (key.startsWith(bucketPrefix)) {
    key = key.slice(bucketPrefix.length)
  }

  const encoded = key
    .split("/")
    .filter(Boolean)
    .map((seg) => encodeURIComponent(seg))
    .join("/")

  const url = `${base}/storage/v1/object/public/${bucket}/${encoded}`

  if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
    console.debug("[nest-evidence] resolved public URL", {
      storedKey: trimmed,
      bucket,
      url
    })
  }

  return url
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
  return `${buildPaketRoomRelativePath(userId, handoverId)}/${safeStamp()}_${safe}.webp`
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
  return `${buildPaketRoomRelativePath(userId, handoverId)}/${photoType}_${safeStamp()}_${filenameBase}.webp`
}

export function buildProfileLogoPath(userId: string): string {
  return `${userId}/profile/logo.png`
}

const STORAGE_LIST_PAGE = 1000
const STORAGE_REMOVE_BATCH = 100

/**
 * Lists every object key under a prefix (recursive). Folders have no `metadata.size`.
 */
async function listAllObjectPathsUnderPrefix(
  supabase: SupabaseClient,
  bucket: string,
  prefix: string
): Promise<string[]> {
  const collected: string[] = []
  let offset = 0

  for (;;) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: STORAGE_LIST_PAGE,
      offset,
      sortBy: { column: "name", order: "asc" }
    })

    if (error) {
      const msg = error.message?.toLowerCase() ?? ""
      if (
        msg.includes("not found") ||
        msg.includes("does not exist") ||
        msg.includes("no such")
      ) {
        return []
      }
      throw error
    }

    if (!data || data.length === 0) break

    for (const item of data) {
      if (item.name === ".emptyFolderPlaceholder") continue

      const childPath = prefix ? `${prefix}/${item.name}` : item.name
      const size = (item.metadata as { size?: number } | null | undefined)?.size
      const hasSize = typeof size === "number"
      const looksLikeFile = /\.(jpe?g|png|gif|webp|pdf)$/i.test(item.name)

      if (hasSize || looksLikeFile) {
        collected.push(childPath)
      } else {
        const nested = await listAllObjectPathsUnderPrefix(
          supabase,
          bucket,
          childPath
        )
        collected.push(...nested)
      }
    }

    if (data.length < STORAGE_LIST_PAGE) break
    offset += STORAGE_LIST_PAGE
  }

  return collected
}

export type DeleteHandoverStorageResult = {
  deleted: number
  errors: string[]
}

/**
 * Deletes all objects in the canonical handover room:
 * `paket/{user_id}/{handover_id}/` in the nest-evidence bucket.
 * Safe when the prefix is empty or missing (no throw).
 */
export async function deleteHandoverStorage(
  supabase: SupabaseClient,
  userId: string,
  handoverId: string
): Promise<DeleteHandoverStorageResult> {
  const errors: string[] = []
  const uid = String(userId ?? "").trim()
  const hid = String(handoverId ?? "").trim()
  if (!uid || !hid) {
    return { deleted: 0, errors: [] }
  }

  const prefix = buildPaketRoomRelativePath(uid, hid)
  let paths: string[] = []

  try {
    paths = await listAllObjectPathsUnderPrefix(
      supabase,
      NEST_EVIDENCE_BUCKET,
      prefix
    )
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    errors.push(msg)
    return { deleted: 0, errors }
  }

  if (paths.length === 0) {
    return { deleted: 0, errors: [] }
  }

  let deleted = 0
  for (let i = 0; i < paths.length; i += STORAGE_REMOVE_BATCH) {
    const chunk = paths.slice(i, i + STORAGE_REMOVE_BATCH)
    const { error } = await supabase.storage
      .from(NEST_EVIDENCE_BUCKET)
      .remove(chunk)
    if (error) {
      errors.push(error.message)
    } else {
      deleted += chunk.length
    }
  }

  return { deleted, errors }
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
