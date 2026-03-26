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
      className={`shrink-0 px-6 py-4 text-center ${className}`}
    >
      <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-[#3E2723]/30">
        NEST76 STUDIO • PRODUCT OF THE ARCHIVE
      </p>
      <p className="mt-1 text-[8px] font-medium uppercase tracking-[0.3em] text-[#3E2723]/30">
        © 2026 ALL RIGHTS RESERVED
      </p>
    </motion.footer>
  )
}
