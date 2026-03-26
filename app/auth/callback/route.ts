import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const DEFAULT_NEXT = "/paket"

function safeNextPath(raw: string | null): string {
  if (!raw) return DEFAULT_NEXT
  try {
    const decoded = decodeURIComponent(raw)
    if (!decoded.startsWith("/") || decoded.startsWith("//")) return DEFAULT_NEXT
    return decoded
  } catch {
    return DEFAULT_NEXT
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const next = safeNextPath(url.searchParams.get("next"))

  const oauthErr =
    url.searchParams.get("error_description") ||
    url.searchParams.get("error")

  if (oauthErr) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(oauthErr)}`, url.origin)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=missing_code", url.origin)
    )
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            /* ignore when cookies are read-only */
          }
        }
      }
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin)
    )
  }

  return NextResponse.redirect(new URL(next, url.origin))
}
