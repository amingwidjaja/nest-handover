"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase/browser"
import { compressJpegUnderMaxBytes } from "@/lib/image-evidence"
import { NEST_EVIDENCE_BUCKET } from "@/lib/nest-evidence-upload"
import { getClientDeviceMeta } from "@/lib/receipt-trust"

export default function PreviewPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [displayUrl, setDisplayUrl] = useState<string | null>(null)
  /** Ready-to-upload JPEG (compressed on load, not on submit). */
  const [uploadBlob, setUploadBlob] = useState<Blob | null>(null)
  const [preparing, setPreparing] = useState(true)
  const [saving, setSaving] = useState(false)
  const blobUrlRef = useRef<string | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem(`handover_${id}_photo`)
    if (!stored) {
      router.replace(`/handover/${id}`)
      return
    }

    let cancelled = false

    ;(async () => {
      setPreparing(true)
      try {
        const rawBlob = await (await fetch(stored)).blob()
        const compressed = await compressJpegUnderMaxBytes(rawBlob)
        if (cancelled) return
        setUploadBlob(compressed)
        const u = URL.createObjectURL(compressed)
        blobUrlRef.current = u
        setDisplayUrl(u)
      } catch (e) {
        console.error("PREVIEW_COMPRESS:", e)
        if (!cancelled) {
          setUploadBlob(null)
          setDisplayUrl(stored)
        }
      } finally {
        if (!cancelled) setPreparing(false)
      }
    })()

    return () => {
      cancelled = true
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
      }
    }
  }, [id, router])

  function handleRetake() {
    window.location.href = `/handover/${id}`
  }

  async function handleConfirm() {
    if (preparing) return

    const stored = sessionStorage.getItem(`handover_${id}_photo`)
    if (!stored && !uploadBlob) return

    setSaving(true)

    try {
      const supabase = createBrowserSupabaseClient()
      const {
        data: { session }
      } = await supabase.auth.getSession()
      if (!session) {
        router.push(
          `/login?redirect=${encodeURIComponent(`/handover/${id}/preview`)}`
        )
        setSaving(false)
        return
      }

      let blob = uploadBlob
      if (!blob) {
        blob = await compressJpegUnderMaxBytes(
          await (await fetch(stored!)).blob()
        )
      }

      const proofFile = new File([blob], `${Date.now()}_bukti.jpg`, {
        type: "image/jpeg"
      })

      const fd = new FormData()
      fd.set("handover_id", id)
      fd.set("mode", "proof_only")
      fd.set("file", proofFile)

      const up = await fetch("/api/handover/upload-photo", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: fd
      })
      const upJson = (await up.json().catch(() => ({}))) as {
        success?: boolean
        storagePath?: string
        publicUrl?: string
        error?: string
      }
      if (!up.ok || !upJson.storagePath) {
        console.error("UPLOAD_DEBUG:", upJson)
        throw new Error(
          upJson.error || `Upload gagal (bucket: ${NEST_EVIDENCE_BUCKET})`
        )
      }
      const photo_url = upJson.storagePath

      const meta = JSON.parse(
        sessionStorage.getItem(`handover_${id}_meta`) || "{}"
      )

      const receiver_type = meta.mode === "direct" ? "direct" : "proxy"

      const { device_id, device_model } = getClientDeviceMeta()

      const res = await fetch("/api/handover/receive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          handover_id: id,
          receive_method: meta.mode === "direct" ? "direct_photo" : "proxy_photo",
          receiver_type,
          receiver_name: meta.mode === "direct" ? "" : meta.delegateName || "",
          receiver_relation: meta.mode === "direct" ? "" : meta.relation || "",
          photo_url,
          device_id,
          device_model
        })
      })

      const result = await res.json()

      if (!result.success) {
        throw new Error(result.error || "fail")
      }

      sessionStorage.removeItem(`handover_${id}_photo`)

      setSaving(false)
      router.replace(`/handover/${id}/location`)
    } catch (err) {
      console.error("UPLOAD_DEBUG:", err)
      alert(
        err instanceof Error
          ? `Gagal menyimpan: ${err.message}`
          : "Gagal menyimpan"
      )
      setSaving(false)
    }
  }

  return (
    <div className="min-h-full bg-[#FAF9F6] text-[#3E2723] flex flex-col justify-between">
      <main className="p-6 pt-6">
        <h2 className="text-2xl font-medium mb-6 text-center">Preview Bukti</h2>

        <div className="relative w-full aspect-square border border-[#E0DED7] rounded-sm overflow-hidden shadow-md mb-6 bg-[#FAF9F6]">
          {displayUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayUrl}
                alt="Preview"
                className="absolute inset-0 w-full h-full object-cover"
              />
              {(preparing || saving) && (
                <div className="absolute inset-0 bg-[#FAF9F6]/65 flex flex-col items-center justify-center z-10">
                  <span className="text-xs font-medium text-[#3E2723] animate-pulse">
                    {preparing ? "Memproses…" : "Menyimpan…"}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs font-medium text-[#3E2723] animate-pulse">
                Memproses…
              </span>
            </div>
          )}
        </div>

        {!preparing && !saving && (
          <div className="flex gap-3">
            <button
              onClick={handleRetake}
              className="flex-1 border border-[#E0DED7] py-3 rounded-sm"
            >
              Retake
            </button>

            <button
              onClick={handleConfirm}
              disabled={!displayUrl}
              className="flex-1 bg-[#3E2723] text-white py-3 rounded-sm disabled:opacity-40"
            >
              Gunakan Foto
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
