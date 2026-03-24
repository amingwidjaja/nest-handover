/**
 * Evidence photos: square crop, max edge 1000px, target &lt; 100KB, WebP with JPEG fallback.
 */

const DEFAULT_MAX_BYTES = 100 * 1024

/**
 * Square crop + resize to JPEG (legacy / fallback when WebP encoder unavailable).
 */
export async function cropSquareResizeToJpeg(
  input: Blob | File,
  maxEdge = 1200,
  quality = 0.82
): Promise<Blob> {
  const bitmap = await createImageBitmap(input)
  try {
    const size = Math.min(bitmap.width, bitmap.height)
    const sx = (bitmap.width - size) / 2
    const sy = (bitmap.height - size) / 2

    const canvas = document.createElement("canvas")
    canvas.width = Math.min(maxEdge, size)
    canvas.height = Math.min(maxEdge, size)

    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("canvas")

    ctx.drawImage(
      bitmap,
      sx,
      sy,
      size,
      size,
      0,
      0,
      canvas.width,
      canvas.height
    )

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    )
    if (!blob) throw new Error("toBlob failed")
    return blob
  } finally {
    bitmap.close()
  }
}

/** Prefer WebP; fall back to JPEG if `canvas.toBlob('image/webp')` is unavailable. */
export async function cropSquareToWebpOrJpeg(
  input: Blob | File,
  maxEdge: number,
  quality: number
): Promise<Blob> {
  const bitmap = await createImageBitmap(input)
  try {
    const size = Math.min(bitmap.width, bitmap.height)
    const sx = (bitmap.width - size) / 2
    const sy = (bitmap.height - size) / 2
    const edge = Math.min(maxEdge, size)

    const canvas = document.createElement("canvas")
    canvas.width = edge
    canvas.height = edge

    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("canvas")

    ctx.drawImage(
      bitmap,
      sx,
      sy,
      size,
      size,
      0,
      0,
      edge,
      edge
    )

    const webp = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality)
    )
    if (webp && webp.size > 0) return webp

    const jpegQ = Math.min(0.95, quality + 0.08)
    const jpeg = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", jpegQ)
    )
    if (jpeg && jpeg.size > 0) return jpeg
    throw new Error("toBlob failed")
  } finally {
    bitmap.close()
  }
}

/**
 * Client-side compression: target under ~100KB, max edge 1000px, WebP (JPEG fallback).
 */
export async function compressEvidenceWebpUnder100kb(
  input: Blob | File,
  maxBytes = DEFAULT_MAX_BYTES,
  initialMaxEdge = 1000
): Promise<Blob> {
  let quality = 0.82
  let maxEdge = initialMaxEdge
  let blob = await cropSquareToWebpOrJpeg(input, maxEdge, quality)
  let guard = 0
  while (blob.size > maxBytes && guard < 32) {
    guard++
    if (quality > 0.48) {
      quality = Math.max(0.45, quality - 0.06)
    } else if (maxEdge > 280) {
      maxEdge = Math.floor(maxEdge * 0.88)
    } else {
      quality = Math.max(0.42, quality - 0.04)
    }
    blob = await cropSquareToWebpOrJpeg(input, maxEdge, quality)
  }
  return blob
}

/**
 * @deprecated Alias — same pipeline as {@link compressEvidenceWebpUnder100kb}.
 */
export async function compressJpegUnderMaxBytes(
  input: Blob | File,
  maxBytes = DEFAULT_MAX_BYTES,
  initialMaxEdge = 1000
): Promise<Blob> {
  return compressEvidenceWebpUnder100kb(input, maxBytes, initialMaxEdge)
}

/** For sessionStorage preview after compression (reliable vs revoked blob: URLs). */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onloadend = () => resolve(r.result as string)
    r.onerror = () => reject(new Error("FileReader failed"))
    r.readAsDataURL(blob)
  })
}

/** Convert a data URL to binary for multipart upload (call on Submit only). */
export function dataUrlToBlob(dataUrl: string): Blob {
  const trimmed = dataUrl.trim()
  const comma = trimmed.indexOf(",")
  if (comma === -1) throw new Error("Invalid data URL")

  const header = trimmed.slice(0, comma)
  const payload = trimmed.slice(comma + 1)
  const mimeMatch = /^data:([^;,]+)/.exec(header)
  const mime = mimeMatch?.[1] ?? "image/webp"

  if (/;base64/i.test(header)) {
    const bin = atob(payload)
    const len = bin.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i)
    return new Blob([bytes], { type: mime })
  }

  const decoded = decodeURIComponent(payload)
  const te = new TextEncoder()
  return new Blob([te.encode(decoded)], { type: mime })
}
