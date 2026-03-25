import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

function randomInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let s = ""
  for (let i = 0; i < 8; i++) {
    s += chars[Math.floor(Math.random() * chars.length)]
  }
  return s
}

/**
 * Creates a NEST76 STUDIO organization; caller becomes OWNER.
 */
export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const name = typeof body.name === "string" ? body.name.trim() : ""
  if (!name) {
    return NextResponse.json({ error: "Organization name required" }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  const { data: existing } = await admin
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .maybeSingle()

  if (existing?.org_id) {
    return NextResponse.json(
      { error: "Profil sudah terhubung ke sebuah studio." },
      { status: 409 }
    )
  }

  for (let attempt = 0; attempt < 8; attempt++) {
    const invite = randomInviteCode()
    const { data: org, error } = await admin
      .from("organizations")
      .insert({
        name,
        owner_id: user.id,
        invite_code: invite
      })
      .select()
      .single()

    if (!error && org) {
      const { error: upErr } = await admin
        .from("profiles")
        .update({
          org_id: org.id,
          role: "OWNER",
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id)

      if (upErr) {
        await admin.from("organizations").delete().eq("id", org.id)
        return NextResponse.json({ error: upErr.message }, { status: 500 })
      }

      console.log(
        `[NEST76 STUDIO] Organization created id=${org.id} owner=${user.id}`
      )
      return NextResponse.json({ success: true, organization: org })
    }

    if (!error?.message?.toLowerCase().includes("duplicate")) {
      return NextResponse.json(
        { error: error?.message ?? "Gagal membuat studio" },
        { status: 500 }
      )
    }
  }

  return NextResponse.json(
    { error: "Tidak dapat membuat kode undangan unik" },
    { status: 500 }
  )
}
