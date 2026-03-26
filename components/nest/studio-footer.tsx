"use client"

import { motion } from "framer-motion"

type StudioFooterProps = {
  className?: string
}

export function StudioFooter({ className = "" }: StudioFooterProps) {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      /* py-2 biar ga terlalu makan tempat di bawah */
      className={`shrink-0 px-6 py-2 text-center ${className}`}
    >
      {/* text-[#3E2723]/70: Biar TEGAS dan GAHAR, ga bening lagi! */}
      <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#3E2723]/70">
        NEST76 STUDIO • PRODUCT OF THE ARCHIVE
      </p>
      <p className="mt-1 text-[8px] font-medium uppercase tracking-[0.3em] text-[#3E2723]/40">
        © 2026 ALL RIGHTS RESERVED
      </p>
    </motion.footer>
  )
}