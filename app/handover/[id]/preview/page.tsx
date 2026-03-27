"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase/browser"
import { dataUrlToBlob } from "@/lib/image-evidence"
import { NEST_EVIDENCE_BUCKET } from "@/lib/nest-evidence-upload"
import { getClientDeviceMeta } from "@/lib/receipt-trust"

type UploadStage = "idle" | "uploading" | "saving" | "done" | "error"

const STAGE_LABEL: Record<UploadStage, string> = {
  idle: "",
  uploading: "Mengunggah foto…",
  saving: "Menyimpan bukti…",
  done: "Tersimpan",
  error: "Gagal",
}

export default function PreviewPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [displayUrl, setDisplayUrl] = useState<string | null>(null)
  const [stage, setStage] = useState<UploadStage>("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const xhrRef = useRef<XMLHttpRequest | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem(`handover_${id}_photo`)
    if (!stored?.startsWith("data:")) {
      router.replace(`/handover/${id}`)
      return
    }
    setDisplayUrl(stored)
  }, [id, router])

  function handleRetake() {
    xhrRef.current?.abort()
    setStage("idle")
    setProgress(0)
    setErrorMsg(null)
    window.location.href = `/handover/${id}`
  }

  async function handleConfirm() {
    if (stage === "uploading" || stage === "saving") return

    const stored = sessionStorage.getItem(`handover_${id}_photo`)
    if (!stored?.startsWith("data:")) {
      setErrorMsg("Foto tidak ditemukan. Ambil ulang.")
      return
    }

    setStage("uploading")
    setProgress(0)
    setErrorMsg(null)

    try {
      const supabase = createBrowserSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push(`/login?redirect=${encodeURIComponent(`/handover/${id}/preview`)}`)
        return
      }

      let blob: Blob
      try {
        blob = dataUrlToBlob(stored)
      } catch {
        throw new Error("Data foto tidak valid, ambil ulang.")
      }

      const ext = blob.type.includes("webp") ? "webp" : "jpg"
      const proofFile = new File([blob], `${Date.now()}_bukti.${ext}`, {
        type: blob.type || "image/webp",
      })

      const storagePath = await uploadWithProgress(
        proofFile,
        id,
        session.access_token,
        (pct) => setProgress(pct)
      )

      setStage("saving")
      setProgress(100)

      const meta = JSON.parse(
        sessionStorage.getItem(`handover_${id}_meta`) || "{}"
      )
      const receiver_type = meta.mode === "direct" ? "direct" : "proxy"
      const { device_id, device_model } = getClientDeviceMeta()

      // Read GPS captured silently in background on [id]/page — one payload, no race condition
      let gps: { lat: number; lng: number; accuracy: number } | null = null
      try {
        const raw = sessionStorage.getItem(`handover_${id}_gps`)
        if (raw) gps = JSON.parse(raw)
      } catch { /* ignore */ }

      const res = await fetch("/api/handover/receive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handover_id: id,
          receive_method: meta.mode === "direct" ? "direct_photo" : "proxy_photo",
          receiver_type,
          receiver_name: meta.mode === "direct" ? "" : meta.delegateName || "",
          receiver_relation: meta.mode === "direct" ? "" : meta.relation || "",
          notes: meta.notes || "",
          photo_url: storagePath,
          device_id,
          device_model,
          // GPS inline — no separate call, no separate job
          gps_lat: gps?.lat ?? null,
          gps_lng: gps?.lng ?? null,
          gps_accuracy: gps?.accuracy ?? null,
        }),
      })

      const result = await res.json()
      if (!result.success) throw new Error(result.error || "Gagal menyimpan")

      // Cleanup sessionStorage
      sessionStorage.removeItem(`handover_${id}_photo`)
      sessionStorage.removeItem(`handover_${id}_meta`)
      sessionStorage.removeItem(`handover_${id}_gps`)

      setStage("done")
      await new Promise((r) => setTimeout(r, 400))

      // Redirect to success page (not dashboard — that's for the sender)
      router.replace(`/handover/${id}/success`)
    } catch (err) {
      if ((err as Error).message === "aborted") return
      console.error("[preview] error:", err)
      setErrorMsg(err instanceof Error ? err.message : "Gagal menyimpan")
      setStage("error")
    }
  }

  const isBusy = stage === "uploading" || stage === "saving"
  const preparing = displayUrl === null

  return (
    <div className="min-h-full bg-[#FAF9F6] text-[#3E2723] flex flex-col justify-between">
      <main className="p-6 pt-6">
        <h2 className="text-xl font-medium mb-4 text-center">Konfirmasi Foto</h2>

        <div className="relative w-full aspect-square border border-[#E0DED7] rounded-sm overflow-hidden shadow-md mb-4 bg-[#FAF9F6]">
          {displayUrl ? (
            <img
              src={displayUrl}
              alt="Preview bukti serah terima"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs text-[#A1887F] animate-pulse">Memuat…</span>
            </div>
          )}

          {isBusy && (
            <div className="absolute inset-0 bg-[#FAF9F6]/80 flex flex-col items-center justify-center gap-3 z-10">
              <span className="text-xs font-medium text-[#3E2723]">
                {STAGE_LABEL[stage]}
              </span>
              <div className="w-48 h-1 bg-[#E0DED7] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#3E2723] rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[10px] tabular-nums text-[#A1887F]">
                {progress}%
              </span>
            </div>
          )}

          {stage === "done" && (
            <div className="absolute inset-0 bg-[#FAF9F6]/80 flex items-center justify-center z-10">
              <span className="text-sm font-medium text-[#3E2723]">Tersimpan ✓</span>
            </div>
          )}
        </div>

        {stage === "error" && errorMsg && (
          <div className="mb-4 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        {!preparing && stage !== "done" && (
          <div className="flex gap-3">
            <button
              onClick={handleRetake}
              disabled={isBusy}
              className="flex-1 border border-[#E0DED7] py-3 rounded-sm text-sm disabled:opacity-40"
            >
              Ambil Ulang
            </button>
            <button
              onClick={handleConfirm}
              disabled={!displayUrl || isBusy}
              className="flex-1 bg-[#3E2723] text-white py-3 rounded-sm text-sm disabled:opacity-40"
            >
              {stage === "error" ? "Coba Lagi" : "Gunakan Foto"}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

// ── XHR upload with progress ──────────────────────────────────

async function uploadWithProgress(
  file: File,
  handoverId: string,
  accessToken: string,
  onProgress: (pct: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const fd = new FormData()
    fd.set("handover_id", handoverId)
    fd.set("mode", "proof_only")
    fd.set("file", file)

    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 90))
      }
    })

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText)
          if (json.storagePath) { onProgress(95); resolve(json.storagePath) }
          else reject(new Error(json.error || "Upload gagal, coba lagi."))
        } catch { reject(new Error("Respons server tidak valid.")) }
      } else {
        let msg = `Upload gagal (${xhr.status})`
        try { const j = JSON.parse(xhr.responseText); if (j.error) msg = j.error } catch { }
        reject(new Error(msg))
      }
    })

    xhr.addEventListener("error", () => reject(new Error("Koneksi terputus, coba lagi.")))
    xhr.addEventListener("abort", () => reject(new Error("aborted")))
    xhr.addEventListener("timeout", () => reject(new Error("Upload timeout, coba lagi.")))

    xhr.timeout = 30000
    xhr.open("POST", "/api/handover/upload-photo")
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`)
    xhr.send(fd)
  })
}
