'use client'

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/** Legacy URL: handover flow starts at mode selection. */
export default function CreatePageRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/handover/select")
  }, [router])

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center text-sm text-[#3E2723]/60">
      Mengalihkan…
    </div>
  )
}
