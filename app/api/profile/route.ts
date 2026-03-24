import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = getSupabaseAdmin()
  const { data: profile, error } = await admin
    .from("profiles")
    .select(
      "user_type, company_name, company_logo_url, display_name, company_address, onboarded_at"
    )
    .eq("id", user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    email: user.email,
    profile: profile ?? null
  })
}

export async function PATCH(req: Request) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const company_name =
    typeof body.company_name === "string" ? body.company_name.trim() : undefined
  const company_address =
    typeof body.company_address === "string"
      ? body.company_address.trim()
      : undefined

  if (company_name === undefined && company_address === undefined) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  const { data: profile } = await admin
    .from("profiles")
    .select("user_type")
    .eq("id", user.id)
    .single()

  if (profile?.user_type !== "umkm") {
    return NextResponse.json(
      { error: "Company fields only available for UMKM accounts" },
      { status: 403 }
    )
  }

  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  }
  if (company_name !== undefined) update.company_name = company_name || null
  if (company_address !== undefined) update.company_address = company_address || null

  const { error } = await admin.from("profiles").update(update).eq("id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
