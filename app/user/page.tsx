"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/** Legacy URL: profil pengirim kini lewat akun + onboarding. */
export default function UserPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/choose-type?redirect=/paket")
  }, [router])

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center text-sm text-[#A1887F]">
      Mengalihkan…
    </div>
  )
}
