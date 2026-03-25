"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { HANDOVER_MODE_KEY, type HandoverMode } from "@/lib/handover-mode"

const PRIMARY = "#3E2723"
const BG = "#FAF9F6"

function clearLiteOnlyDrafts() {
  try {
    localStorage.removeItem("draft_destination_address")
    localStorage.removeItem("draft_destination_lat")
    localStorage.removeItem("draft_destination_lng")
    localStorage.removeItem("draft_destination_city")
    localStorage.removeItem("draft_destination_postcode")
    localStorage.removeItem("draft_receiver_email")
    localStorage.removeItem("draft_address")
    localStorage.removeItem("draft_lat")
    localStorage.removeItem("draft_lng")
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
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: BG, color: PRIMARY }}
    >
      <main className="mx-auto w-full max-w-lg flex-1 px-6 pb-10 pt-12 sm:px-8">
        <header className="mb-10 space-y-2">
          <p
            className="text-[10px] font-medium uppercase tracking-[0.32em]"
            style={{ color: PRIMARY }}
          >
            NEST Paket
          </p>
          <h1
            className="text-[1.65rem] font-light leading-tight tracking-tight sm:text-3xl"
            style={{ color: PRIMARY }}
          >
            Pilih cara dokumentasi
          </h1>
          <p
            className="text-[13px] leading-relaxed opacity-80"
            style={{ color: PRIMARY }}
          >
            Satu ketukan — menu berikut mengatur alur formulir Anda.
          </p>
        </header>

        <div className="space-y-6">
          <button
            type="button"
            onClick={() => choose("lite")}
            className="group w-full rounded-sm border-2 border-dashed bg-white/70 px-6 py-7 text-left shadow-sm transition-all active:scale-95 sm:px-8 sm:py-8"
            style={{ borderColor: `${PRIMARY}55`, color: PRIMARY }}
          >
            <div className="flex flex-col items-start gap-4">
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.28em]"
                style={{ color: PRIMARY }}
              >
                RINGKAS
              </span>
              <span
                className="font-light tracking-[0.06em] sm:text-2xl text-[1.35rem]"
                style={{ color: PRIMARY }}
              >
                NEST-LITE
              </span>
              <p
                className="text-[13px] leading-[1.65] sm:text-[14px]"
                style={{ color: PRIMARY }}
              >
                Mode instan untuk dokumentasi harian tanpa birokrasi alamat. Cukup
                catat barangnya, biar sistem yang mengunci waktu serah terimanya.
                Cocok untuk mahasiswa, karyawan kantor, atau sekadar pengingat:
                &ldquo;Barang gue ada di siapa?&rdquo;.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => choose("pro")}
            className="group w-full rounded-sm border-2 bg-white px-6 py-7 text-left shadow-md transition-all active:scale-95 sm:px-8 sm:py-8"
            style={{ borderColor: PRIMARY, color: PRIMARY }}
          >
            <div className="flex flex-col items-start gap-4">
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.28em]"
                style={{ color: PRIMARY }}
              >
                LENGKAP
              </span>
              <span
                className="font-light tracking-[0.06em] sm:text-2xl text-[1.35rem]"
                style={{ color: PRIMARY }}
              >
                NEST-PRO
              </span>
              <p
                className="text-[13px] leading-[1.65] sm:text-[14px]"
                style={{ color: PRIMARY }}
              >
                Standar profesional untuk UMKM dan kebutuhan resmi. Membangun
                integritas pengiriman dengan validasi Alamat presisi, Geo-Tagging
                otomatis, dan sistem notifikasi otomatis. Dokumentasi sah yang
                siap untuk skala bisnis.
              </p>
            </div>
          </button>
        </div>

        <p
          className="mx-auto mt-14 max-w-md text-center text-[10px] leading-relaxed sm:text-[11px]"
          style={{ color: PRIMARY }}
        >
          © 2026 NEST76 STUDIO • Membangun alat yang membantu manusia, bukan
          menggantikannya. Precision in every hand-off.
        </p>
      </main>

      <div
        className="mt-auto flex justify-start border-t px-6 py-6 text-sm backdrop-blur-sm sm:px-8"
        style={{ borderColor: `${PRIMARY}18`, backgroundColor: `${BG}f2` }}
      >
        <Link
          href="/paket"
          className="transition-colors hover:opacity-80"
          style={{ color: PRIMARY }}
        >
          ← Kembali
        </Link>
      </div>
    </div>
  )
}
