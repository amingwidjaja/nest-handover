"use client"

import Link from "next/link"
import { Home } from "lucide-react"

export function StudioHeader() {
  return (
    <header
      className="fixed top-0 inset-x-0 z-50 flex h-16 items-center justify-between border-b border-[#3E2723]/5 bg-[#FAF9F6]/85 px-6 backdrop-blur-md"
      role="banner"
    >
      <Link
        href="/paket"
        className="flex min-w-0 items-center transition-opacity hover:opacity-90 active:scale-[0.98]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-nest-paket.png"
          alt=""
          className="h-7 w-auto shrink-0"
        />
        <span className="ml-3 text-[10px] font-black uppercase tracking-[0.25em] text-[#3E2723]">
          NEST76 PAKET
        </span>
      </Link>

      <Link
        href="/paket"
        aria-label="Beranda Paket"
        className="shrink-0 text-[#3E2723] opacity-80 transition-transform active:scale-90"
      >
        <Home className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </Link>
    </header>
  )
}
