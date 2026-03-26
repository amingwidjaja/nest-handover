import { Suspense } from "react"
import { LoginForm } from "./login-form"

/** Smart gateway (LoginForm): email check → MASUK vs DAFTAR; signup uses emailRedirectTo `/auth/callback?next=…` for PKCE return. */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center text-sm text-[#A1887F]">
          Memuat…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
