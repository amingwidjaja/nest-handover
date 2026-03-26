import imageCompression from "browser-image-compression"

/** Client-side resize/compress before Supabase upload (Chrome-optimized). */
export async function compressPackagePhotoForUpload(file: File): Promise<Blob> {
  const out = await imageCompression(file, {
    maxWidthOrHeight: 1200,
    initialQuality: 0.7,
    useWebWorker: true
  })
  return out
}
