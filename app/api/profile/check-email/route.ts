import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const raw = searchParams.get("email") ?? ""
  const email = raw.trim()

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Email tidak valid" }, { status: 400 })
  }

  try {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin.rpc("profile_exists_for_email", {
      p_email: email
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ exists: Boolean(data) })
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : "Gagal memeriksa email"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
