'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type Row = {
  id: string
  created_at: string
  received_at: string | null
  status: string
  receiver_name: string
  package_text: string
}

export default function LogPage() {
  const [pending, setPending] = useState<Row[]>([])
  const [received, setReceived] = useState<Row[]>([])

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("handover")
        .select(`
          id,
          status,
          created_at,
          received_at,
          handover_items(description),
          receive_event(receiver_name)
        `)

      if (error || !data) return

      const rows: Row[] = data.map((r: any) => {
        const firstItem = r.handover_items?.[0]?.description || "-"
        const package_text =
          firstItem.length > 42 ? firstItem.slice(0, 42) + "..." : firstItem

        return {
          id: r.id,
          created_at: r.created_at,
          received_at: r.received_at,
          status: r.status,
          receiver_name: r.status === "received"
            ? (r.receive_event?.[0]?.receiver_name || "-")
            : "dalam proses",
          package_text,
        }
      })

      setPending(
        rows
          .filter((r) => r.status !== "received")
          .sort((a, b) => b.created_at.localeCompare(a.created_at))
      )

      setReceived(
        rows
          .filter((r) => r.status === "received")
          .sort((a, b) => (b.received_at || "").localeCompare(a.received_at || ""))
      )
    }

    load()
  }, [])

  return (
    <div className="min-h-screen bg-[#FAF9F6] px-5 pt-3 pb-6">
      <div className="mx-auto w-full max-w-4xl">
        <h1 className="text-center text-lg mb-4">Daftar Paket</h1>

        <div className="space-y-6">
          <div>
            <div className="mb-2 text-xs text-neutral-500">
              dalam proses
            </div>

            <div className="h-52 overflow-y-auto">
              {pending.length === 0 ? (
                <div className="py-3 text-xs text-neutral-400 border-b border-neutral-200">
                  belum ada data
                </div>
              ) : (
                pending.map((row) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-[1.5fr_1fr_1.8fr_1fr] gap-3 border-b border-neutral-200 py-3 text-xs"
                  >
                    <div>{new Date(row.created_at).toLocaleString()}</div>
                    <div className="truncate">{row.receiver_name}</div>
                    <div className="truncate">{row.package_text}</div>
                    <div className="text-right">dalam proses</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs text-neutral-500">
              paket telah diterima
            </div>

            <div className="h-72 overflow-y-auto">
              {received.length === 0 ? (
                <div className="py-3 text-xs text-neutral-400 border-b border-neutral-200">
                  belum ada data
                </div>
              ) : (
                received.map((row) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-[1.5fr_1fr_1.8fr_1fr] gap-3 border-b border-neutral-200 py-3 text-xs"
                  >
                    <div>{new Date(row.received_at || "").toLocaleString()}</div>
                    <div className="truncate">{row.receiver_name}</div>
                    <div className="truncate">{row.package_text}</div>
                    <div className="text-right">diterima</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-neutral-500">
          Photo akan di delete otomatis setelah melewati 30 hari, atau setelah
          proses serah terima selesai dan kami buatkan buktinya. Terima kasih.
        </p>
      </div>
    </div>
  )
}