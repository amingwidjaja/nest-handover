import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { buildProfileLogoPath, NEST_EVIDENCE_BUCKET } from "@/lib/nest-evidence-upload"

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = getSupabaseAdmin()

  const { data: profile } = await admin
    .from("profiles")
    .select("user_type")
    .eq("id", user.id)
    .single()

  if (!profile || profile.user_type !== "personal") {
    return NextResponse.json(
      { error: "Upgrade is only available for Personal accounts" },
      { status: 400 }
    )
  }

  const ct = req.headers.get("content-type") || ""
  let company_name = ""
  let logoBuffer: Buffer | null = null

  if (ct.includes("multipart/form-data")) {
    const form = await req.formData()
    company_name = String(form.get("company_name") ?? "").trim()
    const file = form.get("logo")
    if (file instanceof File && file.size > 0) {
      logoBuffer = Buffer.from(await file.arrayBuffer())
    }
  } else {
    const body = await req.json().catch(() => ({}))
    company_name = String(body.company_name ?? "").trim()
  }

  if (!company_name) {
    return NextResponse.json(
      { error: "company_name is required for UMKM upgrade" },
      { status: 400 }
    )
  }

  let company_logo_url: string | null = null

  if (logoBuffer && logoBuffer.length > 0) {
    const path = buildProfileLogoPath(user.id)
    const { error: upErr } = await admin.storage
      .from(NEST_EVIDENCE_BUCKET)
      .upload(path, logoBuffer, {
        contentType: "image/png",
        upsert: true
      })

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 })
    }

    const { data: pub } = admin.storage.from(NEST_EVIDENCE_BUCKET).getPublicUrl(path)
    company_logo_url = pub.publicUrl
  }

  const updatePayload: Record<string, unknown> = {
    user_type: "umkm",
    company_name,
    updated_at: new Date().toISOString()
  }
  if (company_logo_url) {
    updatePayload.company_logo_url = company_logo_url
  }

  const { error } = await admin
    .from("profiles")
    .update(updatePayload)
    .eq("id", user.id)
    .eq("user_type", "personal")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, company_logo_url })
}
