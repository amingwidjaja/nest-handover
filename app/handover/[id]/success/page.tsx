'use client'

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function SuccessPage() {
  const params = useParams()
  const id = typeof params.id === "string"
    ? params.id
    : Array.isArray(params.id) ? params.id[0] : ""

  const [serialNumber, setSerialNumber] = useState<string | null>(null)
  const [receiverName, setReceiverName] = useState<string | null>(null)
  const [shareToken, setShareToken] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      const res = await fetch(`/api/handover/detail?id=${id}`)
      const data = await res.json()
      if (cancelled || data?.error) return
      if (typeof data.serial_number === "string" && data.serial_number.trim()) {
        setSerialNumber(data.serial_number.trim())
      }
      if (typeof data.receiver_target_name === "string") {
        setReceiverName(data.receiver_target_name.trim())
      }
      if (typeof data.share_token === "string" && data.share_token.trim()) {
        setShareToken(data.share_token.trim())
      }
    })()
    return () => { cancelled = true }
  }, [id])

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col items-center justify-center px-8">

      {/* Icon */}
      <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-[#E0DED7]">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path
            d="M6 16L13 23L26 9"
            stroke="#3E2723"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-light tracking-tight mb-3 text-center">
        Tanda terima berhasil
      </h1>

      {receiverName && (
        <p className="text-sm text-[#A1887F] mb-1 text-center">
          Paket untuk <span className="font-medium text-[#3E2723]">{receiverName}</span> telah dicatat.
        </p>
      )}

      <p className="text-xs text-[#A1887F] leading-relaxed text-center max-w-xs mb-8">
        Bukti digital sudah tersimpan. Pengirim akan mendapat notifikasi otomatis.
      </p>

      {serialNumber && (
        <div className="mb-8 text-center">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#A1887F]">
            No. Tanda Terima Digital
          </span>
          <div className="mt-1 font-mono text-base font-medium text-[#3E2723]">
            {serialNumber}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          href="/dashboard"
          className="w-full text-center bg-[#3E2723] text-[#FAF9F6] py-3 text-sm font-medium tracking-wide rounded-sm active:scale-[0.98] transition-transform"
        >
          Lihat Daftar Paket
        </Link>
        {shareToken && (
          <Link
            href={`/receipt/${shareToken}`}
            className="w-full text-center border border-[#3E2723] py-3 text-sm text-[#3E2723] rounded-sm active:scale-[0.98] transition-transform"
          >
            Lihat Tanda Terima
          </Link>
        )}
        <Link
          href="/paket"
          className="w-full text-center border border-[#E0DED7] py-3 text-sm text-[#3E2723] rounded-sm active:scale-[0.98] transition-transform"
        >
          Kembali ke Beranda
        </Link>
      </div>

    </div>
  )
}
