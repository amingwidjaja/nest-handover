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
