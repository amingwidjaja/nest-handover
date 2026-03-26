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
      "user_type, company_name, company_logo_url, display_name, company_address, whatsapp, address, street_address, district, city, postal_code, latitude, longitude, onboarded_at, org_id, role"
    )
    .eq("id", user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let organization: {
    id: string
    name: string
    logo_url: string | null
    invite_code: string
  } | null = null

  if (profile?.org_id) {
    const { data: org } = await admin
      .from("organizations")
      .select("id, name, logo_url, invite_code")
      .eq("id", profile.org_id)
      .maybeSingle()
    if (org) organization = org
  }

  return NextResponse.json({
    email: user.email,
    profile: profile
      ? { ...profile, organization }
      : null
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
