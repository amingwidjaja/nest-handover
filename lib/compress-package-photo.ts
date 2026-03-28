import imageCompression from "browser-image-compression"

/** Crop image to center square using Canvas, returns Blob. */
function cropToSquare(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const size = Math.min(img.width, img.height)
      const sx = (img.width - size) / 2
      const sy = (img.height - size) / 2
      const canvas = document.createElement("canvas")
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext("2d")
      if (!ctx) { reject(new Error("canvas not supported")); return }
      ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size)
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error("crop failed")),
        "image/webp",
        0.92
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("load failed")) }
    img.src = url
  })
}

/** Client-side crop to square + resize/compress before Supabase upload. */
export async function compressPackagePhotoForUpload(file: File): Promise<Blob> {
  const cropped = await cropToSquare(file)
  const croppedFile = new File([cropped], file.name, { type: "image/webp" })
  const out = await imageCompression(croppedFile, {
    maxWidthOrHeight: 1200,
    initialQuality: 0.7,
    useWebWorker: true
  })
  return out
}
