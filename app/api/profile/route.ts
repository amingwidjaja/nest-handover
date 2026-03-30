import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { buildProfileLogoPath, NEST_EVIDENCE_BUCKET } from "@/lib/nest-evidence-upload"

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = getSupabaseAdmin()
  const { data: profile, error } = await admin
    .from("profiles")
    .select("user_type, company_name, company_logo_url, display_name, company_address, whatsapp, address, street_address, district, city, postal_code, latitude, longitude, onboarded_at, org_id, role")
    .eq("id", user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let organization: { id: string; name: string; logo_url: string | null; invite_code: string } | null = null
  if (profile?.org_id) {
    const { data: org } = await admin
      .from("organizations")
      .select("id, name, logo_url, invite_code")
      .eq("id", profile.org_id)
      .maybeSingle()
    if (org) organization = org
  }

  return NextResponse.json({ email: user.email, profile: profile ? { ...profile, organization } : null })
}

export async function PATCH(req: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = getSupabaseAdmin()
  const { data: profile } = await admin
    .from("profiles")
    .select("user_type")
    .eq("id", user.id)
    .single()

  if (profile?.user_type !== "umkm") {
    return NextResponse.json({ error: "Hanya untuk akun UMKM" }, { status: 403 })
  }

  const ct = (req.headers.get("content-type") || "").toLowerCase()
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (ct.includes("multipart/form-data")) {
    // FormData dari profil UMKM
    const form          = await req.formData()
    const company_name  = String(form.get("company_name") ?? "").trim()
    const whatsapp      = String(form.get("whatsapp") ?? "").trim()
    const street_address = String(form.get("street_address") ?? "").trim()
    const district      = String(form.get("district") ?? "").trim()
    const city          = String(form.get("city") ?? "").trim()
    const postal_code   = String(form.get("postal_code") ?? "").trim()
    const logoFile      = form.get("logo")

    if (!company_name) return NextResponse.json({ error: "Nama usaha wajib diisi" }, { status: 400 })
    if (!street_address) return NextResponse.json({ error: "Alamat jalan wajib diisi" }, { status: 400 })
    if (!city) return NextResponse.json({ error: "Kota wajib diisi" }, { status: 400 })

    update.company_name   = company_name
    update.whatsapp       = whatsapp || null
    update.street_address = street_address
    update.district       = district || null
    update.city           = city
    update.postal_code    = postal_code || null
    update.company_address = [street_address, district, city, postal_code].filter(Boolean).join(", ")

    // Upload logo baru kalau ada
    const hasLogo = logoFile && typeof logoFile === "object" && "size" in logoFile && (logoFile as Blob).size > 0
    if (hasLogo && logoFile instanceof Blob) {
      const buf  = Buffer.from(await logoFile.arrayBuffer())
      const path = buildProfileLogoPath(user.id)
      const { error: upErr } = await admin.storage
        .from(NEST_EVIDENCE_BUCKET)
        .upload(path, buf, { contentType: logoFile.type || "image/png", upsert: true })
      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
      const { data: pub } = admin.storage.from(NEST_EVIDENCE_BUCKET).getPublicUrl(path)
      update.company_logo_url = pub.publicUrl
    }
  } else {
    // JSON legacy (hanya company_name)
    const body = await req.json().catch(() => ({}))
    const company_name = typeof body.company_name === "string" ? body.company_name.trim() : undefined
    if (!company_name) return NextResponse.json({ error: "Nama usaha wajib diisi" }, { status: 400 })
    update.company_name = company_name
  }

  const { error } = await admin.from("profiles").update(update).eq("id", user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
