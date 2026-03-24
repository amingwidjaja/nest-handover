import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { buildProfileLogoPath } from "@/lib/nest-evidence-upload"

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = getSupabaseAdmin()
  const { data: existing } = await admin
    .from("profiles")
    .select("id, onboarded_at")
    .eq("id", user.id)
    .maybeSingle()

  if (existing?.onboarded_at) {
    return NextResponse.json(
      { error: "Onboarding sudah selesai" },
      { status: 409 }
    )
  }

  const ct = req.headers.get("content-type") || ""

  if (ct.includes("multipart/form-data")) {
    const form = await req.formData()
    const type = String(form.get("type") ?? "").trim()
    if (type === "umkm") {
      const company_name = String(form.get("company_name") ?? "").trim()
      const company_address = String(form.get("company_address") ?? "").trim()
      const file = form.get("logo")
      if (!company_name || !company_address) {
        return NextResponse.json(
          { error: "Nama bisnis dan alamat wajib diisi" },
          { status: 400 }
        )
      }

      let company_logo_url: string | null = null
      if (file instanceof File && file.size > 0) {
        const buf = Buffer.from(await file.arrayBuffer())
        const path = buildProfileLogoPath(user.id)
        const { error: upErr } = await admin.storage
          .from("nest-evidence")
          .upload(path, buf, {
            contentType: file.type || "image/png",
            upsert: true
          })
        if (upErr) {
          return NextResponse.json({ error: upErr.message }, { status: 500 })
        }
        const { data: pub } = admin.storage.from("nest-evidence").getPublicUrl(path)
        company_logo_url = pub.publicUrl
      }

      const { error } = await admin
        .from("profiles")
        .update({
          user_type: "umkm",
          company_name,
          company_address,
          company_logo_url,
          display_name: null,
          onboarded_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, user_type: "umkm" })
    }

    return NextResponse.json({ error: "Tipe tidak valid" }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  const type = typeof body.type === "string" ? body.type.trim() : ""

  if (type === "personal") {
    const display_name =
      typeof body.display_name === "string" ? body.display_name.trim() : ""
    if (!display_name) {
      return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 })
    }

    const { error } = await admin
      .from("profiles")
      .update({
        user_type: "personal",
        display_name,
        onboarded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, user_type: "personal" })
  }

  return NextResponse.json({ error: "Invalid body" }, { status: 400 })
}
