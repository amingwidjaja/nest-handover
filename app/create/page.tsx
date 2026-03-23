'use client'

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/** Legacy URL: identity step now lives at `/handover/create`. */
export default function CreatePageRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/handover/create")
  }, [router])

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center text-sm text-[#3E2723]/60">
      Mengalihkan…
    </div>
  )
}
