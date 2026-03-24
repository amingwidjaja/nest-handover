'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { createBrowserSupabaseClient } from "@/lib/supabase/browser"
import { cropSquareResizeToJpeg } from "@/lib/image-evidence"
import { NEST_EVIDENCE_BUCKET } from "@/lib/nest-evidence-upload"

export default function PreviewPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [photo, setPhoto] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem(`handover_${id}_photo`)

    if (!stored) {
      router.replace(`/handover/${id}`)
      return
    }

    setPhoto(stored)
  }, [id, router])

  function handleRetake() {
    window.location.href = `/handover/${id}`
  }

  async function handleConfirm() {
    if (!photo) return

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

      const raw = await (await fetch(photo)).blob()
      const jpeg = await cropSquareResizeToJpeg(raw)
      const proofFile = new File([jpeg], `${Date.now()}_bukti.jpg`, {
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
          photo_url
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

        {photo && (
          <div className="relative w-full aspect-square border border-[#E0DED7] rounded-sm overflow-hidden shadow-md mb-6">
            <Image
              src={photo}
              alt="Preview"
              fill
              className="object-cover"
            />

            {saving && (
              <div className="absolute inset-0 bg-[#FAF9F6]/60 flex items-center justify-center">
                <span className="text-xs animate-pulse">Menyimpan...</span>
              </div>
            )}
          </div>
        )}

        {!saving && (
          <div className="flex gap-3">
            <button
              onClick={handleRetake}
              className="flex-1 border border-[#E0DED7] py-3 rounded-sm"
            >
              Retake
            </button>

            <button
              onClick={handleConfirm}
              className="flex-1 bg-[#3E2723] text-white py-3 rounded-sm"
            >
              Gunakan Foto
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
