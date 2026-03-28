"use client"

import { Suspense, useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Camera, Loader2, X } from "lucide-react"
import { createBrowserSupabaseClient } from "@/lib/supabase/browser"
import { readHandoverMode, HANDOVER_MODE_KEY } from "@/lib/handover-mode"
import { compressPackagePhotoForUpload } from "@/lib/compress-package-photo"
import { NEST_EVIDENCE_BUCKET } from "@/lib/nest-evidence-upload"
import { StudioHeader } from "@/components/nest/studio-header"
import { StudioFooter } from "@/components/nest/studio-footer"
import { PhotoPreviewModal } from "@/components/nest/photo-preview-modal"
import type { HandoverCreateInitialData } from "@/lib/handover-editable-types"

const PRIMARY = "#3E2723"

function PackagePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const handoverIdParam = searchParams.get("handover_id")

  useEffect(() => {
    if (typeof window === "undefined") return
    if (handoverIdParam) return
    if (!readHandoverMode()) router.replace("/handover/select")
  }, [router, handoverIdParam])

  const [items, setItems] = useState(["", "", "", ""])
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const previewUrlRef = useRef<string | null>(null)
  const [editingHandoverId, setEditingHandoverId] = useState<string | null>(null)
  const [editingSerial, setEditingSerial] = useState<string | null>(null)
  const [existingFirstItemPhotoPath, setExistingFirstItemPhotoPath] = useState<string | null>(null)
  const [photoStage, setPhotoStage] = useState<"idle" | "compressing" | "uploading" | "ready">("idle")
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [submitMode, setSubmitMode] = useState<"save" | "handover" | null>(null)
  const compressedBlobRef = useRef<Blob | null>(null)
  const bgUploadPathRef = useRef<string | null>(null)  // path hasil upload background
  const bgUploadPromiseRef = useRef<Promise<string | null> | null>(null)  // promise upload berjalan

  function handleItemChange(index: number, value: string) {
    const copy = [...items]
    copy[index] = value
    setItems(copy)
  }

  useEffect(() => {
    // Restore foto dari sessionStorage kalau ada (back/forward navigation)
    try {
      const savedUrl = sessionStorage.getItem("pkg_photo_preview_url")
      const savedPath = sessionStorage.getItem("pkg_photo_upload_path")
      if (savedUrl) {
        previewUrlRef.current = savedUrl
        setPreviewUrl(savedUrl)
        setPhotoStage(savedPath ? "ready" : "uploading")
        if (savedPath) bgUploadPathRef.current = savedPath
      }
    } catch { /* ignore */ }
    return () => {
      if (previewUrlRef.current?.startsWith("blob:")) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [])

  useEffect(() => {
    const id = handoverIdParam?.trim()
    if (!id) { setEditingHandoverId(null); setEditingSerial(null); setExistingFirstItemPhotoPath(null); return }
    let cancelled = false
    setEditingHandoverId(id)
    fetch(`/api/handover/editable?id=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((data: HandoverCreateInitialData & { error?: string }) => {
        if (cancelled || data.error || !data.handoverId) return
        try {
          localStorage.setItem(HANDOVER_MODE_KEY, data.mode)
          localStorage.setItem("draft_sender_name", data.senderName)
          localStorage.setItem("draft_receiver_name", data.receiverName)
          localStorage.setItem("draft_receiver_whatsapp", data.receiverWhatsapp)
          localStorage.setItem("draft_receiver_contact", data.receiverWhatsapp)
          localStorage.setItem("draft_receiver_email", data.receiverEmail)
          localStorage.setItem("draft_destination_address", data.destinationAddress)
          localStorage.setItem("draft_destination_lat", data.destinationLat != null ? String(data.destinationLat) : "")
          localStorage.setItem("draft_destination_lng", data.destinationLng != null ? String(data.destinationLng) : "")
          localStorage.setItem("draft_destination_district", data.destinationDistrict)
          localStorage.setItem("draft_destination_city", data.destinationCity)
          localStorage.setItem("draft_destination_postcode", data.destinationPostalCode)
        } catch { /* ignore */ }
        setEditingSerial(data.serialNumber ?? null)
        const descs = (data.items ?? []).map((i) => i.description)
        const padded = [...descs]
        while (padded.length < 4) padded.push("")
        setItems(padded.slice(0, 4))
        const firstPath = data.items?.[0]?.photo_url ?? null
        setExistingFirstItemPhotoPath(firstPath)
        if (data.firstItemPhotoPublicUrl) {
          if (previewUrlRef.current?.startsWith("blob:")) URL.revokeObjectURL(previewUrlRef.current)
          previewUrlRef.current = data.firstItemPhotoPublicUrl
          setPreviewUrl(data.firstItemPhotoPublicUrl)
          setPhotoBlob(null)
          setPhotoStage("ready")
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [handoverIdParam])

  function clearPhoto() {
    if (previewUrlRef.current?.startsWith("blob:")) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = null
    setPreviewUrl(null)
    setPhotoBlob(null)
    compressedBlobRef.current = null
    bgUploadPathRef.current = null
    bgUploadPromiseRef.current = null
    setExistingFirstItemPhotoPath(null)
    setPhotoStage("idle")
    try {
      sessionStorage.removeItem("pkg_photo_preview_url")
      sessionStorage.removeItem("pkg_photo_upload_path")
    } catch { /* ignore */ }
  }

  const compressPromiseRef = useRef<Promise<Blob> | null>(null)

  async function handlePhoto(file: File) {
    // Tampilkan preview — compress jalan di background selama user lihat preview
    const rawUrl = URL.createObjectURL(file)
    setPendingFile(file)
    setPendingPreviewUrl(rawUrl)

    // Mulai compress di background, simpan promise-nya
    const promise = compressPackagePhotoForUpload(file)
      .then((compressed) => { compressedBlobRef.current = compressed; return compressed })
      .catch(() => { compressedBlobRef.current = file; return file })
    compressPromiseRef.current = promise
  }

  async function startBgUpload(blob: Blob, handoverId: string, accessToken: string): Promise<string | null> {
    try {
      const ext = blob.type.includes("webp") ? "webp" : "jpg"
      const fd = new FormData()
      fd.set("handover_id", handoverId)
      fd.set("mode", "package_first_item")
      fd.set("file", blob, `package.${ext}`)
      const up = await fetch("/api/handover/upload-photo", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: fd
      })
      const upJson = await up.json().catch(() => ({}))
      if (!up.ok) return null
      const path = upJson.storagePath as string | null
      if (path) {
        bgUploadPathRef.current = path
        try { sessionStorage.setItem("pkg_photo_upload_path", path) } catch { /* ignore */ }
        setPhotoStage("ready")
      }
      return path ?? null
    } catch {
      return null
    }
  }

  async function confirmPhoto() {
    if (!pendingFile) return

    // Tunggu compress selesai kalau belum (biasanya sudah selesai saat user lihat preview)
    if (compressPromiseRef.current) {
      await compressPromiseRef.current
      compressPromiseRef.current = null
    }

    // Tutup modal — user kembali ke page
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl)
    setPendingPreviewUrl(null)
    setPendingFile(null)

    // Pakai compressed blob (sudah pasti siap sekarang), fallback ke file asli
    const blob = compressedBlobRef.current ?? pendingFile
    compressedBlobRef.current = blob
    setPhotoBlob(blob)

    // Set preview dari blob yang sudah di-crop
    const croppedUrl = URL.createObjectURL(blob)
    if (previewUrlRef.current?.startsWith("blob:")) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = croppedUrl
    setPreviewUrl(croppedUrl)

    // Simpan preview url ke sessionStorage (persist across back navigation)
    try { sessionStorage.setItem("pkg_photo_preview_url", croppedUrl) } catch { /* ignore */ }

    // Kalau ada handover_id (edit mode), langsung upload di background
    const hId = (editingHandoverId ?? handoverIdParam ?? "").trim()
    if (hId) {
      setPhotoStage("uploading")
      const supabase = createBrowserSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const promise = startBgUpload(blob, hId, session.access_token)
        bgUploadPromiseRef.current = promise
      } else {
        setPhotoStage("ready")
      }
    } else {
      // Flow baru — belum ada handover_id, upload nanti saat submit
      setPhotoStage("ready")
    }
  }

  function retakePhoto() {
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl)
    setPendingPreviewUrl(null)
    setPendingFile(null)
    compressedBlobRef.current = null
    compressPromiseRef.current = null
    document.getElementById("cameraInput")?.click()
  }

  async function createHandover(mode: "save" | "handover") {
    if (!photoBlob && !existingFirstItemPhotoPath) {
      alert("Foto barang wajib diambil terlebih dahulu")
      return
    }
    if (!items[0].trim()) { alert("Minimal isi 1 nama barang"); return }
    if (saving) return
    if (photoStage === "compressing") { alert("Foto sedang diproses, tunggu sebentar."); return }

    setSubmitMode(mode)
    setSaving(true)

    const supabase = createBrowserSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setSaving(false); setSubmitMode(null); router.push("/login?redirect=/package"); return }

    const updateId = (editingHandoverId ?? handoverIdParam ?? "").trim() || null

    if (!updateId) {
      // Seharusnya tidak terjadi lagi — handover_id selalu ada dari create page
      setSaving(false); setSubmitMode(null)
      alert("Data tidak lengkap. Mulai dari awal.")
      router.push("/handover/create")
      return
    }

    const sender_name = localStorage.getItem("draft_sender_name") || ""
    const receiver_target_name = localStorage.getItem("draft_receiver_name") || ""
    const receiver_whatsapp = localStorage.getItem("draft_receiver_whatsapp") || localStorage.getItem("draft_receiver_contact") || ""
    const receiver_email = localStorage.getItem("draft_receiver_email") || ""

    if (!sender_name || !receiver_target_name) {
      setSaving(false); setSubmitMode(null)
      alert("Data belum lengkap. Mulai dari awal.")
      router.push(updateId ? `/handover/create?id=${encodeURIComponent(updateId)}` : "/handover/create")
      return
    }

    const destination_address = localStorage.getItem("draft_destination_address") || ""
    const destLatRaw = localStorage.getItem("draft_destination_lat")
    const destLngRaw = localStorage.getItem("draft_destination_lng")
    const draftDistrict = localStorage.getItem("draft_destination_district") || ""
    const draftCity = localStorage.getItem("draft_destination_city") || ""
    const draftPostcode = localStorage.getItem("draft_destination_postcode") || ""

    const descriptions = items.map((i) => i.trim()).filter(Boolean)
    const itemRows = descriptions.map((description, index) => ({
      description,
      photo_url: index === 0 ? (photoBlob ? null : existingFirstItemPhotoPath) : null
    }))

    const isSenderProxy = localStorage.getItem("draft_is_sender_proxy") === "true"
    const senderWhatsapp = localStorage.getItem("draft_sender_whatsapp") || ""

    const payload: Record<string, unknown> = {
      sender_name,
      receiver_target_name,
      receiver_target_phone: receiver_whatsapp,
      receiver_whatsapp,
      receiver_email,
      receiver_target_email: receiver_email,
      is_sender_proxy: isSenderProxy,
      sender_whatsapp: isSenderProxy ? senderWhatsapp : null,
      items: itemRows
    }

    if (destination_address.trim()) payload.destination_address = destination_address
    if (destLatRaw && destLngRaw) {
      const dlat = Number(destLatRaw), dlng = Number(destLngRaw)
      if (Number.isFinite(dlat) && Number.isFinite(dlng)) {
        payload.destination_lat = dlat
        payload.destination_lng = dlng
      }
    }
    if (draftDistrict.trim()) payload.destination_district = draftDistrict.trim()
    if (draftCity.trim()) payload.destination_city = draftCity.trim()
    if (draftPostcode.trim()) payload.destination_postal_code = draftPostcode.trim()

    try {
      const res = await fetch(
        updateId ? "/api/handover/update" : "/api/handover/create",
        {
          method: updateId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateId ? { ...payload, handover_id: updateId } : payload)
        }
      )
      const data = await res.json()

      if (res.status === 401) { setSaving(false); setSubmitMode(null); router.push("/login?redirect=/package"); return }
      if (res.status === 429) { setSaving(false); setSubmitMode(null); alert(data.error || "Batas paket tercapai"); return }
      if (res.status === 409) { setSaving(false); setSubmitMode(null); alert(data.error || "Paket tidak dapat diperbarui."); return }
      if (!data.success) { setSaving(false); setSubmitMode(null); alert(data.error || "Gagal membuat Tanda Terima Digital"); return }

      const effectiveId = (data.handover_id as string) || updateId || ""

      if (photoBlob && effectiveId && session.access_token) {
        try {
          if (!bgUploadPathRef.current) {
            // Belum terupload atau upload background gagal — upload sekarang
            const path = await startBgUpload(compressedBlobRef.current || photoBlob, effectiveId, session.access_token)
            if (!path) throw new Error("Upload gagal, coba lagi.")
          }
          // bgUploadPathRef.current sudah terisi — tidak perlu upload lagi
        } catch (err) {
          setSaving(false); setSubmitMode(null)
          alert(`Gagal mengunggah foto. ${err instanceof Error ? err.message : ""}`)
          return
        }
      }

      ;["draft_sender_name","draft_sender_contact","draft_receiver_name","draft_receiver_contact",
        "draft_receiver_whatsapp","draft_receiver_email","draft_destination_address",
        "draft_destination_district","draft_destination_lat","draft_destination_lng",
        "draft_destination_city","draft_destination_postcode",HANDOVER_MODE_KEY,"draft_handover_id",
        "draft_is_sender_proxy","draft_sender_whatsapp"
      ].forEach((k) => { try { localStorage.removeItem(k) } catch { /* ignore */ } })
      try {
        sessionStorage.removeItem("pkg_photo_preview_url")
        sessionStorage.removeItem("pkg_photo_upload_path")
      } catch { /* ignore */ }

      const sn = typeof data.serial_number === "string" ? data.serial_number : editingSerial ?? ""
      router.push(
        mode === "save"
          ? sn ? `/paket?sn=${encodeURIComponent(sn)}` : "/paket"
          : `/handover/${effectiveId}`
      )
    } catch {
      setSaving(false); setSubmitMode(null)
      alert("Terjadi kesalahan koneksi")
    }
  }

  const isBusy = saving || photoStage === "compressing"

  return (
    <div
      className="flex min-h-screen flex-col bg-[#FAF9F6] font-sans text-[var(--primary-color)]"
      style={{ ["--primary-color" as string]: PRIMARY }}
    >
      <style jsx global>{`
        input, textarea { font-size: 16px !important; }
      `}</style>

      <StudioHeader />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-24 pb-48">

        {/* TITLE */}
        <div className="mb-6">
          <h2 className="text-lg font-medium tracking-tight text-[#3E2723]">
            Daftar Barang
          </h2>
          {editingSerial && (
            <p className="mt-0.5 text-[11px] font-mono text-[#A1887F]">{editingSerial}</p>
          )}
        </div>

        {/* FOTO + GUIDELINES */}
        <div className="flex gap-4 mb-7">

          {/* Kiri 40% */}
          <div className="w-[40%] shrink-0">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              id="cameraInput"
              className="hidden"
              onChange={(e) => {
                if (!e.target.files?.[0]) return
                handlePhoto(e.target.files[0])
                e.target.value = ""
              }}
            />
            {!previewUrl ? (
              <label
                htmlFor="cameraInput"
                className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#3E2723]/20 bg-white transition active:scale-[0.97] active:border-[#3E2723]/40"
              >
                <Camera size={22} strokeWidth={1.5} className="text-[#3E2723]/40" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#9A8F88]">Ambil Foto</span>
              </label>
            ) : (
              <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-[#E0DED7] shadow-sm">
                <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                {(photoStage === "compressing" || photoStage === "uploading") && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[#FAF9F6]/60">
                    <Loader2 size={18} className="animate-spin text-[#3E2723]/60" />
                    <span className="text-[8px] font-medium uppercase tracking-wider text-[#9A8F88]">
                      {photoStage === "uploading" ? "Mengunggah…" : "Memproses…"}
                    </span>
                  </div>
                )}
                {photoStage === "ready" && (
                  <div className="absolute bottom-0 inset-x-0 flex justify-between p-1.5">
                    <label
                      htmlFor="cameraInput"
                      className="cursor-pointer rounded-md bg-[#3E2723]/80 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white active:scale-95 transition-transform"
                    >
                      Ganti
                    </label>
                    <button
                      type="button"
                      onClick={clearPhoto}
                      disabled={saving}
                      className="flex h-6 w-6 items-center justify-center rounded-md bg-white/90 shadow-sm active:scale-95 transition-transform disabled:opacity-40"
                    >
                      <X size={11} strokeWidth={2.5} className="text-[#3E2723]" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Kanan — guidelines */}
          <div className="flex-1 flex flex-col justify-center space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1887F]">Foto Barang</p>
            <p className="text-[12px] leading-relaxed text-[#5D4037]">
              Ambil <span className="font-semibold">1 foto</span> yang mencakup semua barang yang akan diserahterimakan.
            </p>
            <p className="text-[11px] leading-relaxed text-[#9A8F88]">
              Foto ini menjadi bukti visual dalam dokumen tanda terima digital Anda.
            </p>
            {photoStage === "ready" && (
              <p className="text-[10px] font-semibold text-[#3B6D11]">✓ Foto siap</p>
            )}
            {!previewUrl && (
              <label
                htmlFor="cameraInput"
                className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] font-medium text-[#3E2723] underline underline-offset-2 active:opacity-70"
              >
                <Camera size={11} strokeWidth={2} />
                Buka kamera
              </label>
            )}
          </div>
        </div>

        {/* LIST BARANG */}
        <div className="space-y-0 mb-8">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 border-b border-[#E0DED7] py-2.5">
              <span className="w-5 shrink-0 text-right text-[12px] tabular-nums text-[#9A8F88]">
                {i + 1}.
              </span>
              <input
                value={item}
                onChange={(e) => handleItemChange(i, e.target.value)}
                className="flex-1 bg-transparent text-[14px] text-[#3E2723] placeholder:text-[#C4B8B0] outline-none"
                placeholder={i === 0 ? "Nama barang pertama…" : `Barang ${i + 1}`}
                autoFocus={i === 0}
              />
            </div>
          ))}
        </div>

      </main>

      {/* 3 BUTTONS FIXED BOTTOM */}
      <div className="fixed bottom-0 inset-x-0 z-[60] border-t border-[#E0DED7] bg-[#FAF9F6]/95 backdrop-blur-md">
        <div className="mx-auto max-w-md px-5 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-2">

          {/* Baris 1: Edit + Simpan */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                const id = editingHandoverId ?? handoverIdParam
                router.push(id ? `/handover/create?id=${encodeURIComponent(id)}` : "/handover/create")
              }}
              disabled={isBusy}
              className="flex-1 flex items-center justify-center py-3 rounded-xl border border-[#E0DED7] bg-white text-[11px] font-medium text-[#3E2723] transition-transform active:scale-[0.96] disabled:opacity-40"
            >
              ← Edit
            </button>
            <button
              type="button"
              onClick={() => createHandover("save")}
              disabled={isBusy}
              className="flex-1 flex items-center justify-center py-3 rounded-xl border border-[#E0DED7] bg-white text-[11px] font-medium text-[#3E2723] transition-transform active:scale-[0.96] disabled:opacity-40"
            >
              {saving && submitMode === "save"
                ? <Loader2 size={14} className="animate-spin" />
                : "Simpan"
              }
            </button>
          </div>

          {/* Baris 2: Tanda Terima full width */}
          <button
            type="button"
            onClick={() => createHandover("handover")}
            disabled={isBusy}
            className="w-full flex items-center justify-center py-4 rounded-xl bg-[#3E2723] text-[11px] font-bold uppercase tracking-wider text-[#FAF9F6] transition-transform active:scale-[0.96] disabled:opacity-45"
          >
            {saving && submitMode === "handover"
              ? <Loader2 size={14} className="animate-spin" />
              : "Tanda Terima →"
            }
          </button>

        </div>
      </div>

      {pendingPreviewUrl && (
        <PhotoPreviewModal
          previewUrl={pendingPreviewUrl}
          onConfirm={confirmPhoto}
          onRetake={retakePhoto}
        />
      )}

      <StudioFooter className="hidden" />
    </div>
  )
}

export default function PackagePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6] text-sm text-[#9A8F88]">
        Memuat\u2026
      </div>
    }>
      <PackagePageInner />
    </Suspense>
  )
}
