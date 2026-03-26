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
      className={`fixed bottom-0 inset-x-0 z-50 border-t border-[#3E2723]/5 bg-[#FAF9F6]/85 px-6 py-6 text-center backdrop-blur-md ${className}`}
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
