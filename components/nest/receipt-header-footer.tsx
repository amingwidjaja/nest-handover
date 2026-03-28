"use client"

import Link from "next/link"
import { Home } from "lucide-react"
import { motion } from "framer-motion"

export function ReceiptHeader({ serialNumber }: { serialNumber?: string }) {
  return (
    <header className="fixed top-0 inset-x-0 z-[50] flex h-16 items-center justify-between border-b border-[#3E2723]/5 bg-[#FAF9F6]/85 px-6 backdrop-blur-md">
      <Link href="/paket" className="flex items-center gap-3 transition-opacity hover:opacity-90">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-nest-paket.png" alt="" className="h-7 w-auto shrink-0" />
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#3E2723]">
            NEST76 PAKET
          </span>
          {serialNumber && (
            <p className="text-[9px] font-mono text-[#A1887F] leading-tight">{serialNumber}</p>
          )}
        </div>
      </Link>
      <Link href="/paket" aria-label="Beranda" className="text-[#3E2723] opacity-70 transition-transform active:scale-90">
        <Home className="h-5 w-5" strokeWidth={1.75} />
      </Link>
    </header>
  )
}

/** Public header — untuk sisi penerima (receive/[token]), tidak ada link ke /paket */
export function PublicReceiptHeader({ serialNumber }: { serialNumber?: string }) {
  return (
    <header className="fixed top-0 inset-x-0 z-[50] flex h-16 items-center justify-between border-b border-[#3E2723]/5 bg-[#FAF9F6]/85 px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-nest-paket.png" alt="" className="h-7 w-auto shrink-0" />
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#3E2723]">
            NEST76 PAKET
          </span>
          {serialNumber && (
            <p className="text-[9px] font-mono text-[#A1887F] leading-tight">{serialNumber}</p>
          )}
        </div>
      </div>
    </header>
  )
}

export function ReceiptFooter() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-0 inset-x-0 z-[50] border-t border-[#3E2723]/5 bg-[#FAF9F6]/85 px-6 py-6 text-center backdrop-blur-md"
    >
      <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-[#3E2723]/70">
        NEST76 STUDIO • PRODUCT OF THE ARCHIVE
      </p>
      <p className="mt-1 text-[8px] font-medium uppercase tracking-[0.3em] text-[#3E2723]/40">
        © 2026 ALL RIGHTS RESERVED
      </p>
    </motion.footer>
  )
}
