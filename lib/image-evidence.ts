/**
 * Square crop + resize to JPEG for nest-evidence uploads.
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

const DEFAULT_MAX_BYTES = 100 * 1024

/**
 * Client-side compression: keep uploads fast and under ~100KB when possible.
 * Iteratively lowers JPEG quality and max edge until size fits or limits hit.
 */
export async function compressJpegUnderMaxBytes(
  input: Blob | File,
  maxBytes = DEFAULT_MAX_BYTES,
  initialMaxEdge = 1200
): Promise<Blob> {
  let quality = 0.82
  let maxEdge = initialMaxEdge
  let blob = await cropSquareResizeToJpeg(input, maxEdge, quality)
  let guard = 0
  while (blob.size > maxBytes && guard < 28) {
    guard++
    if (quality > 0.52) {
      quality = Math.max(0.48, quality - 0.07)
    } else if (maxEdge > 360) {
      maxEdge = Math.floor(maxEdge * 0.86)
      quality = 0.78
    } else {
      quality = Math.max(0.42, quality - 0.04)
    }
    blob = await cropSquareResizeToJpeg(input, maxEdge, quality)
  }
  return blob
}
