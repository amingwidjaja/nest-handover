"use client"

import { Suspense, useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Camera, ChevronRight, ChevronLeft, Loader2, X } from "lucide-react"
import { createBrowserSupabaseClient } from "@/lib/supabase/browser"
import { readHandoverMode, HANDOVER_MODE_KEY } from "@/lib/handover-mode"
import { compressPackagePhotoForUpload } from "@/lib/compress-package-photo"
import { NEST_EVIDENCE_BUCKET } from "@/lib/nest-evidence-upload"
import { NestPrimaryButton } from "@/components/nest/primary-button"
import { StudioHeader } from "@/components/nest/studio-header"
import { StudioFooter } from "@/components/nest/studio-footer"
import type { HandoverCreateInitialData } from "@/lib/handover-editable-types"

const PRIMARY = "#3E2723"

const inputClass =
  "line-input min-h-[2.5rem] flex-1 w-full rounded-2xl border border-[#E0DED7] bg-white px-3 py-2 text-[14px] text-[var(--primary-color)] placeholder:text-[#9A8F88] outline-none transition focus:border-[var(--primary-color)] focus:ring-2 focus:ring-[var(--primary-color)]/15"

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
  const [photoStage, setPhotoStage] = useState<"idle" | "compressing" | "ready">("idle")
  const [saving, setSaving] = useState(false)
  const [submitMode, setSubmitMode] = useState<"save" | "handover" | null>(null)
  const compressedBlobRef = useRef<Blob | null>(null)

  function handleItemChange(index: number, value: string) {
    const copy = [...items]
    copy[index] = value
    setItems(copy)
  }

  useEffect(() => {
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
    setExistingFirstItemPhotoPath(null)
    setPhotoStage("idle")
  }

  async function handlePhoto(file: File) {
    // Show raw preview immediately
    const rawUrl = URL.createObjectURL(file)
    if (previewUrlRef.current?.startsWith("blob:")) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = rawUrl
    setPreviewUrl(rawUrl)
    setPhotoStage("compressing")

    // Compress in background while user fills items
    try {
      const compressed = await compressPackagePhotoForUpload(file)
      compressedBlobRef.current = compressed
      setPhotoBlob(compressed)
      const compressedUrl = URL.createObjectURL(compressed)
      if (previewUrlRef.current?.startsWith("blob:")) URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = compressedUrl
      setPreviewUrl(compressedUrl)
      setPhotoStage("ready")
    } catch {
      compressedBlobRef.current = file
      setPhotoBlob(file)
      setPhotoStage("ready")
    }
  }

  async function createHandover(mode: "save" | "handover") {
    if (!items[0].trim()) { alert("Minimal isi 1 barang"); return }
    if (saving) return
    if (photoStage === "compressing") { alert("Foto sedang diproses, tunggu sebentar."); return }

    setSubmitMode(mode)
    setSaving(true)

    const supabase = createBrowserSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setSaving(false); setSubmitMode(null); router.push("/login?redirect=/package"); return }

    const updateId = (editingHandoverId ?? handoverIdParam ?? "").trim() || null

    if (!updateId) {
      const lim = await fetch("/api/handover/limits")
      const limJson = await lim.json()
      if (limJson.authenticated && limJson.at_limit) {
        setSaving(false); setSubmitMode(null)
        alert(limJson.error || "Batas paket aktif tercapai.")
        return
      }
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
          const blob = compressedBlobRef.current || photoBlob
          const ext = blob.type.includes("webp") ? "webp" : blob.type.includes("png") ? "png" : "jpg"
          const fd = new FormData()
          fd.set("handover_id", effectiveId)
          fd.set("mode", "package_first_item")
          fd.set("file", blob, `package.${ext}`)
          const up = await fetch("/api/handover/upload-photo", {
            method: "POST",
            headers: { Authorization: `Bearer ${session.access_token}` },
            body: fd
          })
          const upJson = (await up.json().catch(() => ({}))) as { error?: string }
          if (!up.ok) throw new Error(upJson.error || `Upload HTTP ${up.status}`)
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

  return (
    <div
      className="flex min-h-screen flex-col bg-[#FAF9F6] font-sans text-[var(--primary-color)]"
      style={{ ["--primary-color" as string]: PRIMARY }}
    >
      <style jsx global>{`
        input, textarea { font-size: 16px !important; }
      `}</style>

      <StudioHeader />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-24 pb-44">

        {/* Title */}
        <div className="mb-5">
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#3E2723]">
            Daftar Barang
          </h2>
          <p className="mt-1 text-[11px] text-[#A1887F]">
            Foto produk opsional — bisa dikumpulkan dalam 1 foto bersama.
          </p>
        </div>

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

        {/* Item rows — all 4 visible immediately */}
        <div className="space-y-2 mb-6">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-2">

              {/* Foto slot baris 1, spacer baris lainnya */}
              <div className="w-16 shrink-0 pt-0.5">
                {i === 0 ? (
                  <div className="relative">
                    {!previewUrl ? (
                      <label
                        htmlFor="cameraInput"
                        className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#3E2723]/25 bg-white/80 transition active:scale-95 hover:border-[#3E2723]/50"
                      >
                        <Camera size={18} strokeWidth={1.5} className="text-[#3E2723]/50" />
                        <span className="mt-0.5 text-[7px] font-semibold uppercase tracking-tighter text-[#9A8F88]">Foto</span>
                      </label>
                    ) : (
                      <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-[#E0DED7] bg-white shadow-sm">
                        <img src={previewUrl} alt="" className="h-full w-full object-cover" />

                        {/* Compressing spinner */}
                        {photoStage === "compressing" && (
                          <div className="absolute inset-0 flex items-center justify-center bg-[#FAF9F6]/70">
                            <Loader2 size={14} className="animate-spin text-[#3E2723]/60" />
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={clearPhoto}
                          disabled={saving}
                          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-[#E0DED7] bg-[#FAF9F6] shadow-sm active:scale-95 disabled:opacity-40"
                        >
                          <X size={10} strokeWidth={2.5} />
                        </button>

                        <label
                          htmlFor="cameraInput"
                          className="absolute bottom-0.5 right-0.5 cursor-pointer rounded bg-white/90 px-1 py-0.5 text-[6px] font-bold uppercase tracking-wide text-[#3E2723] shadow-sm"
                        >
                          Ganti
                        </label>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-16 w-16 shrink-0" aria-hidden />
                )}
              </div>

              {/* Input */}
              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                <span className="w-4 shrink-0 text-right text-[12px] font-medium tabular-nums text-[#9A8F88]">
                  {i + 1}.
                </span>
                <textarea
                  value={item}
                  onChange={(e) => handleItemChange(i, e.target.value)}
                  className={inputClass}
                  rows={1}
                  placeholder={i === 0 ? "Nama barang pertama..." : `Barang ${i + 1}`}
                  autoFocus={i === 0}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Back link */}
        <button
          type="button"
          onClick={() => {
            const id = editingHandoverId ?? handoverIdParam
            router.push(id ? `/handover/create?id=${encodeURIComponent(id)}` : "/handover/create")
          }}
          disabled={saving}
          className="mb-4 text-left text-[11px] text-[#A1887F] transition hover:text-[#3E2723] disabled:opacity-40"
        >
          ← Kembali ke detail pengiriman
        </button>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => createHandover("save")}
            disabled={saving || photoStage === "compressing"}
            className="flex items-center justify-between rounded-2xl border-2 border-[#3E2723]/25 bg-white px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#3E2723] transition active:scale-[0.96] disabled:opacity-35"
          >
            {saving && submitMode === "save" ? (
              <span className="flex w-full items-center justify-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Memproses…
              </span>
            ) : (
              <>
                <ChevronLeft size={14} />
                <span>Simpan Draft</span>
              </>
            )}
          </button>

          <NestPrimaryButton
            type="button"
            onClick={() => createHandover("handover")}
            disabled={photoStage === "compressing"}
            loading={saving && submitMode === "handover"}
            className="flex w-full items-center justify-between rounded-2xl bg-[#3E2723] px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#FAF9F6] shadow-sm transition active:scale-[0.96] disabled:opacity-45"
          >
            <span>Tanda Terima</span>
            <ChevronRight size={14} />
          </NestPrimaryButton>
        </div>

      </main>

      <StudioFooter />
    </div>
  )
}

export default function PackagePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6] text-sm text-[#9A8F88]">
        Memuat…
      </div>
    }>
      <PackagePageInner />
    </Suspense>
  )
}
