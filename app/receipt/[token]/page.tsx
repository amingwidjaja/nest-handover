'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

function formatTanggalIndonesia(dateString: string) {
  if (!dateString) return "-"

  const date = new Date(dateString)

  return (
    new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta"
    }).format(date) + " WIB"
  )
}

function formatMetode(method: string) {
  switch (method) {
    case "direct_qr":
      return "QR Code"
    case "direct_photo":
      return "Foto Serah Terima"
    case "proxy_qr":
      return "QR Code (Diwakilkan)"
    case "proxy_photo":
      return "Foto Serah Terima (Diwakilkan)"
    default:
      return "-"
  }
}

function formatStatus(status: string) {
  switch (status) {
    case "draft":
      return "Draft"
    case "created":
      return "Dibuat"
    case "received":
      return "Diterima"
    case "accepted":
      return "Diterima & Disetujui"
    default:
      return status || "-"
  }
}

export default function ReceiptPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [handover, setHandover] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    const res = await fetch(`/api/handover/receipt-data?token=${token}`)
    const data = await res.json()

    setHandover(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [token])

  // 🔥 CORE LOGIC FIX
  useEffect(() => {
    if (!handover) return

    // ACCEPTED → keluar dari page ini
    if (handover.status === "accepted") {

      if (handover.receipt_url) {
        window.location.href = handover.receipt_url
        return
      }

      alert("Bukti sedang diproses, silakan tunggu")
      router.push("/dashboard")
      return
    }

  }, [handover])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <div className="text-center space-y-2">
          <div className="text-sm opacity-60">Menyiapkan data...</div>
        </div>
      </div>
    )
  }

  if (!handover) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        Data serah terima tidak ditemukan
      </div>
    )
  }

  // ❌ HAPUS receipt_status blocking

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col justify-between">

      <main className="p-6 pt-10 max-w-md mx-auto w-full space-y-6">

        <div className="text-center space-y-1">
          <h1 className="text-xl font-light">
            Bukti Serah Terima Paket
          </h1>

          <div className="text-xs opacity-60">
            NEST-Paket
          </div>
        </div>

        <div className="border-t border-[#E0DED7] my-2"></div>

        <div className="mt-5 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="opacity-60">Pengirim:</span>
            <span className="font-medium">{handover.sender_name || "-"}</span>
          </div>

          <div className="flex justify-between">
            <span className="opacity-60">Penerima:</span>
            <span className="font-medium">{handover.receiver_target_name}</span>
          </div>

          <div className="flex justify-between">
            <span className="opacity-60">Status:</span>
            <span className="font-medium">{formatStatus(handover.status)}</span>
          </div>
        </div>

        <div className="border-t border-[#E0DED7] my-1"></div>

        <div className="space-y-2">

          <div className="flex gap-3 items-start mt-6">

            <div className="w-26 aspect-square border border-[#E0DED7] rounded-sm overflow-hidden flex-shrink-0">
              {handover.handover_items?.[0]?.photo_url && (
                <img
                  src={handover.handover_items[0].photo_url}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="flex-1">

              <div className="text-[11px] uppercase tracking-widest opacity-60 mb-1">
                Rincian Paket
              </div>

              <div className="space-y-1 text-sm">
                {handover.handover_items?.map((item: any) => (
                  <div key={item.id}>
                    • {item.description}
                  </div>
                ))}
              </div>

            </div>

          </div>

        </div>

        <div className="border-t border-[#E0DED7] my-2"></div>

        <div className="space-y-2 text-sm">
          <div className="text-[11px] uppercase tracking-widest opacity-60">
            Detail Penerimaan
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="opacity-60">Metode:</span>
              <span>{formatMetode(handover.receive_event?.receive_method)}</span>
            </div>

            <div className="flex justify-between">
              <span className="opacity-60">Waktu:</span>
              <span>{formatTanggalIndonesia(handover.receive_event?.timestamp)}</span>
            </div>

            {handover.receive_event?.receiver_name && (
              <div className="flex justify-between">
                <span className="opacity-60">Diterima oleh:</span>
                <span>{handover.receive_event.receiver_name}</span>
              </div>
            )}

            {handover.receive_event?.receiver_relation && (
              <div className="flex justify-between">
                <span className="opacity-60">Hubungan:</span>
                <span>{handover.receive_event.receiver_relation}</span>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-[#E0DED7] my-2"></div>

      </main>

      <div className="flex justify-center px-6 pb-6 text-sm">
        <Link href="/dashboard" className="opacity-60">
          Kembali ke Dashboard
        </Link>
      </div>

    </div>
  )
}