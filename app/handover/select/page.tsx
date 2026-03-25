"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { HANDOVER_MODE_KEY, type HandoverMode } from "@/lib/handover-mode"

const PRIMARY = "#3E2723"

function clearLiteOnlyDrafts() {
  try {
    localStorage.removeItem("draft_destination_address")
    localStorage.removeItem("draft_destination_lat")
    localStorage.removeItem("draft_destination_lng")
    localStorage.removeItem("draft_destination_city")
    localStorage.removeItem("draft_destination_postcode")
    localStorage.removeItem("draft_receiver_email")
  } catch {
    /* ignore */
  }
}

export default function HandoverSelectModePage() {
  const router = useRouter()

  function choose(mode: HandoverMode) {
    try {
      localStorage.setItem(HANDOVER_MODE_KEY, mode)
      if (mode === "lite") {
        clearLiteOnlyDrafts()
      }
    } catch {
      /* ignore */
    }
    router.push("/handover/create")
  }

  return (
    <div
      className="min-h-screen bg-[#FAF9F6] text-[var(--primary-color)] flex flex-col"
      style={{ ["--primary-color" as string]: PRIMARY }}
    >
      <main className="mx-auto w-full max-w-lg flex-1 px-6 pb-8 pt-14 space-y-10 sm:px-8">
        <header className="space-y-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#9A8F88]">
            NEST Paket
          </p>
          <h1 className="text-2xl font-light tracking-tight text-[var(--primary-color)]">
            Pilih mode
          </h1>
          <p className="text-sm leading-relaxed text-[#6D5D54]">
            Lite fokus pada kontak dan WhatsApp. Pro menambahkan alamat, peta, dan
            email penerima.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => choose("lite")}
            className="group rounded-2xl border border-[#E0DED7] bg-white px-5 py-8 text-left shadow-sm transition hover:border-[var(--primary-color)]/35 hover:shadow-md active:scale-[0.99]"
          >
            <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A1887F]">
              Ringkas
            </span>
            <span className="mt-3 block text-xl font-medium tracking-tight text-[var(--primary-color)]">
              LITE
            </span>
            <span className="mt-2 block text-[12px] leading-relaxed text-[#6D5D54]">
              Tanpa alamat & peta di form
            </span>
          </button>

          <button
            type="button"
            onClick={() => choose("pro")}
            className="group rounded-2xl border border-[#E0DED7] bg-white px-5 py-8 text-left shadow-sm transition hover:border-[var(--primary-color)]/35 hover:shadow-md active:scale-[0.99]"
          >
            <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A1887F]">
              Lengkap
            </span>
            <span className="mt-3 block text-xl font-medium tracking-tight text-[var(--primary-color)]">
              PRO
            </span>
            <span className="mt-2 block text-[12px] leading-relaxed text-[#6D5D54]">
              Alamat, peta, email opsional
            </span>
          </button>
        </div>

        <p className="text-center text-[10px] leading-relaxed text-[#9A8F88]">
          © 2026 NEST76 STUDIO • Infrastruktur digital yang aman dan terverifikasi.
        </p>
      </main>

      <div className="flex justify-start border-t border-[#ECE7E3] bg-[#FAF9F6]/95 px-6 py-6 text-sm backdrop-blur-sm sm:px-8">
        <Link
          href="/"
          className="text-[#9A8F88] transition hover:text-[var(--primary-color)]"
        >
          ← Beranda
        </Link>
      </div>
    </div>
  )
}
