"use client"

import { Suspense, useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Camera,
  Home,
  ChevronRight,
  ChevronLeft,
  Loader2,
  User,
  X
} from "lucide-react"
import Link from "next/link"
import { createBrowserSupabaseClient } from "@/lib/supabase/browser"
import { readHandoverMode, HANDOVER_MODE_KEY } from "@/lib/handover-mode"
import { compressPackagePhotoForUpload } from "@/lib/compress-package-photo"
import { NEST_EVIDENCE_BUCKET } from "@/lib/nest-evidence-upload"
import { NestPrimaryButton } from "@/components/nest/primary-button"
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
    if (!readHandoverMode()) {
      router.replace("/handover/select")
    }
  }, [router, handoverIdParam])

  const [items, setItems] = useState(["", "", "", ""])
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const previewUrlRef = useRef<string | null>(null)
  const [editingHandoverId, setEditingHandoverId] = useState<string | null>(null)
  const [editingSerial, setEditingSerial] = useState<string | null>(null)
  const [existingFirstItemPhotoPath, setExistingFirstItemPhotoPath] = useState<
    string | null
  >(null)
  const [photoProcessing, setPhotoProcessing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [submitMode, setSubmitMode] = useState<"save" | "handover" | null>(
    null
  )

  function handleItemChange(index: number, value: string) {
    const copy = [...items]
    copy[index] = value
    setItems(copy)
  }

  useEffect(() => {
    return () => {
      if (previewUrlRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const id = handoverIdParam?.trim()
    if (!id) {
      setEditingHandoverId(null)
      setEditingSerial(null)
      setExistingFirstItemPhotoPath(null)
      return
    }
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
          localStorage.setItem(
            "draft_destination_lat",
            data.destinationLat != null ? String(data.destinationLat) : ""
          )
          localStorage.setItem(
            "draft_destination_lng",
            data.destinationLng != null ? String(data.destinationLng) : ""
          )
          localStorage.setItem("draft_destination_city", data.destinationCity)
          localStorage.setItem(
            "draft_destination_postcode",
            data.destinationPostalCode
          )
        } catch {
          /* ignore */
        }
        setEditingSerial(data.serialNumber ?? null)
        const descs = (data.items ?? []).map((i) => i.description)
        const padded = [...descs]
        while (padded.length < 4) padded.push("")
        setItems(padded.slice(0, 4))
        const firstPath = data.items?.[0]?.photo_url ?? null
        setExistingFirstItemPhotoPath(firstPath)
        if (data.firstItemPhotoPublicUrl) {
          if (previewUrlRef.current?.startsWith("blob:")) {
            URL.revokeObjectURL(previewUrlRef.current)
          }
          previewUrlRef.current = data.firstItemPhotoPublicUrl
          setPreviewUrl(data.firstItemPhotoPublicUrl)
          setPhotoBlob(null)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [handoverIdParam])

  function clearPhoto() {
    if (previewUrlRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrlRef.current)
    }
    previewUrlRef.current = null
    setPreviewUrl(null)
    setPhotoBlob(null)
    setExistingFirstItemPhotoPath(null)
  }

  async function handlePhoto(file: File) {
    setPhotoProcessing(true)
    try {
      const cropped = await compressPackagePhotoForUpload(file)
      setPhotoBlob(cropped)
      if (previewUrlRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
      const url = URL.createObjectURL(cropped)
      previewUrlRef.current = url
      setPreviewUrl(url)
    } catch (err) {
      console.error("UPLOAD_DEBUG:", err)
      alert("Gagal memproses foto")
    } finally {
      setPhotoProcessing(false)
    }
  }

  async function createHandover(mode: "save" | "handover") {
    if (!items[0].trim()) {
      alert("Minimal isi 1 barang")
      return
    }
    if (saving) return
    setSubmitMode(mode)
    setSaving(true)

    const supabase = createBrowserSupabaseClient()
    const {
      data: { session }
    } = await supabase.auth.getSession()
    if (!session) {
      setSaving(false)
      setSubmitMode(null)
      router.push("/login?redirect=/package")
      return
    }

    const updateId = (editingHandoverId ?? handoverIdParam ?? "").trim() || null

    if (!updateId) {
      const lim = await fetch("/api/handover/limits")
      const limJson = await lim.json()
      if (limJson.authenticated && limJson.at_limit) {
        setSaving(false)
        setSubmitMode(null)
        alert(limJson.error || "Batas paket aktif tercapai.")
        return
      }
    }

    const sender_name = localStorage.getItem("draft_sender_name") || ""
    const receiver_target_name = localStorage.getItem("draft_receiver_name") || ""
    const receiver_whatsapp =
      localStorage.getItem("draft_receiver_whatsapp") ||
      localStorage.getItem("draft_receiver_contact") ||
      ""
    const receiver_email = localStorage.getItem("draft_receiver_email") || ""
    const receiver_target_phone = receiver_whatsapp

    if (!sender_name || !receiver_target_name) {
      setSaving(false)
      setSubmitMode(null)
      alert("Data belum lengkap. Mulai dari awal.")
      router.push(
        updateId
          ? `/handover/create?id=${encodeURIComponent(updateId)}`
          : "/handover/create"
      )
      return
    }

    const destination_address =
      localStorage.getItem("draft_destination_address") || ""
    const destLatRaw = localStorage.getItem("draft_destination_lat")
    const destLngRaw = localStorage.getItem("draft_destination_lng")
    const draftCity = localStorage.getItem("draft_destination_city") || ""
    const draftPostcode = localStorage.getItem("draft_destination_postcode") || ""

    const descriptions = items.map((i) => i.trim()).filter(Boolean)
    const itemRows = descriptions.map((description, index) => ({
      description,
      photo_url:
        index === 0
          ? photoBlob
            ? null
            : existingFirstItemPhotoPath
          : null
    }))

    const payload: Record<string, unknown> = {
      sender_name,
      receiver_target_name,
      receiver_target_phone,
      receiver_whatsapp,
      receiver_email,
      receiver_target_email: receiver_email,
      items: itemRows
    }

    if (destination_address.trim()) {
      payload.destination_address = destination_address
    }
    if (
      destLatRaw != null &&
      destLatRaw !== "" &&
      destLngRaw != null &&
      destLngRaw !== ""
    ) {
      const dlat = Number(destLatRaw)
      const dlng = Number(destLngRaw)
      if (Number.isFinite(dlat) && Number.isFinite(dlng)) {
        payload.destination_lat = dlat
        payload.destination_lng = dlng
      }
    }
    if (draftCity.trim()) {
      payload.destination_city = draftCity.trim()
    }
    if (draftPostcode.trim()) {
      payload.destination_postal_code = draftPostcode.trim()
    }

    try {
      const res = await fetch(
        updateId ? "/api/handover/update" : "/api/handover/create",
        {
          method: updateId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            updateId ? { ...payload, handover_id: updateId } : payload
          )
        }
      )
      const data = await res.json()
      if (process.env.NODE_ENV === "development") {
        console.log(
          "[package]",
          updateId ? "PATCH /api/handover/update" : "POST /api/handover/create",
          res.status,
          data
        )
      }
      if (res.status === 401) {
        setSaving(false)
        setSubmitMode(null)
        router.push("/login?redirect=/package")
        return
      }
      if (res.status === 429) {
        setSaving(false)
        setSubmitMode(null)
        alert(data.error || "Batas paket tercapai")
        return
      }
      if (res.status === 409) {
        setSaving(false)
        setSubmitMode(null)
        alert(data.error || "Paket tidak dapat diperbarui.")
        return
      }
      if (!data.success) {
        setSaving(false)
        setSubmitMode(null)
        alert(
          data.error ||
            (updateId
              ? "Gagal memperbarui Tanda Terima Digital"
              : "Gagal membuat Tanda Terima Digital")
        )
        return
      }

      const effectiveId = (data.handover_id as string) || updateId || ""

      if (photoBlob && effectiveId && session.access_token) {
        try {
          const ext = photoBlob.type.includes("webp")
        ? "webp"
        : photoBlob.type.includes("png")
          ? "png"
          : "jpg"
          const fd = new FormData()
          fd.set("handover_id", effectiveId)
          fd.set("mode", "package_first_item")
          fd.set("file", photoBlob, `package.${ext}`)

          const up = await fetch("/api/handover/upload-photo", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`
            },
            body: fd
          })
          const upJson = (await up.json().catch(() => ({}))) as {
            error?: string
            detail?: string
          }
          if (!up.ok) {
            console.error("UPLOAD_DEBUG:", upJson)
            throw new Error(
              upJson.error || upJson.detail || `Upload HTTP ${up.status}`
            )
          }
        } catch (err) {
          console.error("UPLOAD_DEBUG:", err)
          setSaving(false)
          setSubmitMode(null)
          alert(
            `Gagal mengunggah foto paket (bucket: ${NEST_EVIDENCE_BUCKET}). ${
              err instanceof Error ? err.message : ""
            }`
          )
          return
        }
      }

      localStorage.removeItem("draft_sender_name")
      localStorage.removeItem("draft_sender_contact")
      localStorage.removeItem("draft_receiver_name")
      localStorage.removeItem("draft_receiver_contact")
      localStorage.removeItem("draft_receiver_whatsapp")
      localStorage.removeItem("draft_receiver_email")
      localStorage.removeItem("draft_destination_address")
      localStorage.removeItem("draft_destination_lat")
      localStorage.removeItem("draft_destination_lng")
      localStorage.removeItem("draft_destination_city")
      localStorage.removeItem("draft_destination_postcode")
      try {
        localStorage.removeItem(HANDOVER_MODE_KEY)
        localStorage.removeItem("draft_handover_id")
      } catch {
        /* ignore */
      }

      const sn =
        typeof data.serial_number === "string"
          ? data.serial_number
          : editingSerial ?? ""
      router.push(
        mode === "save"
          ? sn
            ? `/paket?sn=${encodeURIComponent(sn)}`
            : "/paket"
          : `/handover/${effectiveId}`
      )
    } catch (err) {
      console.error("UPLOAD_DEBUG:", err)
      setSaving(false)
      setSubmitMode(null)
      alert("Terjadi kesalahan koneksi")
    }
  }

  return (
    <div
      className="flex h-screen flex-col overflow-hidden bg-[#FAF9F6] font-sans text-[var(--primary-color)]"
      style={{ ["--primary-color" as string]: PRIMARY }}
    >
      <style jsx global>{`
        input,
        textarea {
          font-size: 16px !important;
        }
        @media screen and (max-width: 768px) {
          .line-input {
            font-size: 14px !important;
            transform: scale(1);
          }
        }
      `}</style>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col overflow-y-auto px-5 py-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#3E2723]">
            Daftar Barang
          </h2>
          <div className="flex gap-1">
            <Link
              href="/profile"
              className="rounded-xl p-2 text-[var(--primary-color)] opacity-70 transition active:scale-95"
              title="Profil"
            >
              <User size={20} strokeWidth={1.5} />
            </Link>
            <Link
              href="/paket"
              className="rounded-xl p-2 text-[var(--primary-color)] opacity-70 transition active:scale-[0.96]"
            >
              <Home size={20} strokeWidth={1.5} />
            </Link>
          </div>
        </div>

        <p className="mb-2 text-[10px] uppercase tracking-wider text-[#9A8F88]">
          Foto baris 1
        </p>

        <input
          type="file"
          accept="image/*"
          capture="environment"
          id="cameraInput"
          className="hidden"
          disabled={photoProcessing}
          onChange={(e) => {
            if (!e.target.files) return
            handlePhoto(e.target.files[0])
            e.target.value = ""
          }}
        />

        <div className="min-h-0 flex-1 overflow-y-auto pb-2">
        <div className="space-y-1.5">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-20 shrink-0 pt-0.5">
                {i === 0 ? (
                  <div className="relative">
                    {!previewUrl ? (
                      <label
                        htmlFor="cameraInput"
                        className={`flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--primary-color)]/35 bg-white/80 transition active:scale-95 ${
                          photoProcessing
                            ? "pointer-events-none opacity-50"
                            : "hover:border-[var(--primary-color)]/60"
                        }`}
                      >
                        <Camera
                          className="text-[var(--primary-color)]/50"
                          size={18}
                          strokeWidth={1.5}
                        />
                        <span className="mt-0.5 text-[7px] font-semibold uppercase tracking-tighter text-[#9A8F88]">
                          Foto
                        </span>
                      </label>
                    ) : (
                      <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-[var(--primary-color)]/30 bg-white shadow-sm">
                        <img
                          src={previewUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            clearPhoto()
                          }}
                          disabled={photoProcessing || saving}
                          className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--primary-color)]/20 bg-[#FAF9F6] text-[var(--primary-color)] shadow-sm transition hover:bg-white active:scale-95 disabled:opacity-40"
                          aria-label="Hapus foto"
                        >
                          <X size={12} strokeWidth={2.5} />
                        </button>
                        <label
                          htmlFor="cameraInput"
                          className={`absolute bottom-0.5 right-0.5 rounded bg-white/95 px-1 py-0.5 text-[6px] font-bold uppercase tracking-wide text-[var(--primary-color)] shadow-sm ${
                            photoProcessing ? "pointer-events-none opacity-50" : ""
                          }`}
                        >
                          Ganti
                        </label>
                      </div>
                    )}
                    {photoProcessing && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[#FAF9F6]/85 backdrop-blur-[1px]">
                        <span className="text-[9px] font-medium text-[var(--primary-color)] animate-pulse">
                          …
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-20 w-20 shrink-0" aria-hidden />
                )}
              </div>

              <div className="flex min-w-0 flex-1 items-start gap-1.5 pt-0.5">
                <span
                  className="w-4 shrink-0 pt-2 text-right text-[12px] font-medium tabular-nums text-[#9A8F88]"
                  aria-hidden
                >
                  {i + 1}.
                </span>
                <textarea
                  value={item}
                  onChange={(e) => handleItemChange(i, e.target.value)}
                  className={inputClass}
                  rows={1}
                  placeholder={
                    i === 0 ? "Contoh: Sepatu" : `Barang ${i + 1}`
                  }
                />
              </div>
            </div>
          ))}
        </div>
        </div>

        <div className="mt-3 shrink-0 space-y-2.5 pb-2 pt-0">
          <button
            type="button"
            onClick={() => {
              const id = editingHandoverId ?? handoverIdParam
              router.push(
                id
                  ? `/handover/create?id=${encodeURIComponent(id)}`
                  : "/handover/create"
              )
            }}
            disabled={saving || photoProcessing}
            className="w-full rounded-xl border border-transparent py-2 text-left text-[11px] text-[#A1887F] transition hover:text-[var(--primary-color)] active:scale-[0.96] disabled:opacity-40"
          >
            ← Kembali ke detail pengiriman
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => createHandover("save")}
              disabled={saving || photoProcessing}
              className="flex items-center justify-between rounded-2xl border-2 border-[var(--primary-color)]/25 bg-white px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--primary-color)] transition active:scale-[0.96] disabled:opacity-35"
            >
              {saving && submitMode === "save" ? (
                <span className="flex w-full items-center justify-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  Memproses…
                </span>
              ) : (
                <>
                  <ChevronLeft size={14} />
                  <span className="leading-tight">Simpan Draft</span>
                </>
              )}
            </button>

            <NestPrimaryButton
              type="button"
              onClick={() => createHandover("handover")}
              disabled={photoProcessing}
              loading={saving && submitMode === "handover"}
              className="flex w-full items-center justify-between rounded-2xl bg-[var(--primary-color)] px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#FAF9F6] shadow-sm transition active:scale-[0.96] disabled:opacity-45"
            >
              <span>Tanda Terima</span>
              <ChevronRight size={14} />
            </NestPrimaryButton>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function PackagePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#FAF9F6] text-sm text-[#9A8F88]">
          Memuat…
        </div>
      }
    >
      <PackagePageInner />
    </Suspense>
  )
}
