"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

const BG = "#FAF9F6"
const INK = "#3E2723"

function VerifyInner() {
  const searchParams = useSearchParams()
  const emailRaw = searchParams.get("email")?.trim() || ""

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: BG, color: INK }}
    >
      <div className="absolute right-6 top-6 flex items-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
        <span
          className="text-[10px] font-mono uppercase tracking-[0.28em] opacity-60"
          style={{ color: INK }}
        >
          Systems Online
        </span>
      </div>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center sm:px-8">
        <div className="mb-8 text-6xl leading-none sm:text-7xl" aria-hidden>
          ✉️
        </div>
        <h1
          className="mb-4 max-w-md text-2xl font-light tracking-tight sm:text-3xl"
          style={{ color: INK }}
        >
          THE NEST IS WAITING
        </h1>
        <p
          className="max-w-md text-[15px] leading-relaxed opacity-90 sm:text-base"
          style={{ color: INK }}
        >
          Kami telah mengirimkan tautan verifikasi ke{" "}
          {emailRaw ? (
            <span className="font-medium opacity-100">{emailRaw}</span>
          ) : (
            "email Anda"
          )}
          . Silakan cek folder inbox atau spam Anda untuk mengaktifkan
          infrastruktur NEST76 Anda.
        </p>

        <Link
          href="/"
          className="mt-12 inline-flex min-w-[200px] items-center justify-center border px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] transition hover:opacity-90"
          style={{
            borderColor: INK,
            backgroundColor: INK,
            color: BG
          }}
        >
          Kembali ke Beranda
        </Link>
      </main>
    </div>
  )
}

export default function RegisterVerifyPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen items-center justify-center text-sm"
          style={{ backgroundColor: BG, color: INK }}
        >
          Memuat…
        </div>
      }
    >
      <VerifyInner />
    </Suspense>
  )
}
