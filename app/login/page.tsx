import { Suspense } from "react"
import { LoginForm } from "./login-form"

/** Smart gateway: debounced profile email check → MASUK vs DAFTAR, then /paket or /choose-type. */
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
